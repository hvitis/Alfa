/**
 * Alphabet lesson shared by the Raspberry Pi player and the website tile.
 * Cards and speech stay on the Pi; this module is the timing, strokes, and buttons.
 */

export const SCREEN = Object.freeze({ width: 240, height: 320 });
export const CUES = Object.freeze({ listen: 0.45, prompt: 0.4, silence: 2, praise: Object.freeze([0.5, 0.7]) });
export const CENTER_HOLD_SECONDS = 0.6;

const DRAW = Object.freeze({
  fps: 20,
  drawSeconds: 5,
  strokePause: 0.22,
  introSeconds: 0.5,
  holdSeconds: 0.7,
  celebrationSeconds: 1.8,
});

function bisectRight(values, target) {
  let low = 0;
  let high = values.length;
  while (low < high) {
    const mid = (low + high) >> 1;
    if (target < values[mid]) high = mid;
    else low = mid + 1;
  }
  return low;
}

function curvePoints(controls) {
  const points = [];
  for (let step = 1; step <= 32; step += 1) {
    const t = step / 32;
    let work = controls;
    while (work.length > 1) {
      const next = [];
      for (let index = 0; index < work.length - 1; index += 1) {
        const a = work[index];
        const b = work[index + 1];
        next.push([a[0] * (1 - t) + b[0] * t, a[1] * (1 - t) + b[1] * t]);
      }
      work = next;
    }
    points.push(work[0]);
  }
  return points;
}

export function flattenStroke(commands) {
  const points = [];
  for (const command of commands) {
    const [op, ...values] = command;
    const counts = { M: 2, L: 2, Q: 4, C: 6 };
    if (!Object.hasOwn(counts, op) || values.length !== counts[op]) throw new Error(`Invalid stroke command: ${op}`);
    if (op === 'M') {
      if (points.length) throw new Error('Each stroke must have exactly one initial M command.');
      points.push([values[0], values[1]]);
      continue;
    }
    if (!points.length) throw new Error('A stroke must start with M.');
    const start = points[points.length - 1];
    const end = [values[values.length - 2], values[values.length - 1]];
    if (op === 'L') {
      points.push(end);
      continue;
    }
    const controls = [start];
    for (let index = 0; index < values.length; index += 2) controls.push([values[index], values[index + 1]]);
    points.push(...curvePoints(controls));
  }
  if (points.length < 2) throw new Error('A stroke needs a move and at least one drawing command.');
  const distances = [0];
  for (let index = 1; index < points.length; index += 1) {
    const a = points[index - 1];
    const b = points[index];
    distances.push(distances[index - 1] + Math.hypot(b[0] - a[0], b[1] - a[1]));
  }
  return {
    points,
    distances,
    get length() { return distances[distances.length - 1]; },
    prefix(fraction) {
      const clamped = Math.max(0, Math.min(1, fraction));
      const length = distances[distances.length - 1];
      if (!length || clamped === 1) return points;
      const distance = length * clamped;
      const index = bisectRight(distances, distance);
      const a = points[index - 1];
      const b = points[index];
      const span = distances[index] - distances[index - 1];
      const t = span ? (distance - distances[index - 1]) / span : 0;
      return points.slice(0, index).concat([[a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]]);
    },
  };
}

export function letterStrokes(catalog, letter) {
  const item = catalog.letters[letter];
  if (!item) throw new Error(`Unknown letter ${letter}`);
  let commands = item.strokes ? [...item.strokes] : [];
  if (item.base) {
    const base = catalog.letters[item.base];
    if (base.base) throw new Error('Letter bases cannot refer to another base.');
    commands = [...base.strokes, ...(item.strokes ?? [])];
  }
  if (item.mark) commands = commands.concat(catalog.marks[item.mark]);
  if (!commands.length) throw new Error(`No strokes for ${letter}.`);
  return commands.map(flattenStroke);
}

export function selectedLetters(settings, catalog) {
  const letters = settings.letters;
  if (!Array.isArray(letters) || !letters.length) throw new Error('Lesson letters are missing.');
  for (const letter of letters) {
    if (!catalog.letters[letter]) throw new Error(`Unknown letter ${letter}`);
  }
  return letters.slice();
}

export function catalogFor(data) {
  if (typeof data.strokes === 'function' && typeof data.ink === 'function') return data;
  return {
    strokes(letter) { return letterStrokes(data, letter); },
    ink(letter) { return data.letters[letter].ink ?? '#012a5f'; },
  };
}

export class HoldClock {
  constructor(clock) {
    this.clock = clock;
    this.elapsed = 0;
    this.since = null;
  }

  now() {
    return this.elapsed + (this.since != null ? this.clock() - this.since : 0);
  }

  hold(down) {
    if (down && this.since == null) this.since = this.clock();
    else if (!down && this.since != null) {
      this.elapsed += this.clock() - this.since;
      this.since = null;
    }
  }

  isDown() { return this.since != null; }
}

export class CardMotion {
  constructor(clock, duration = 0.28) {
    this.clock = clock;
    this.duration = duration;
    this.fps = 20;
    this.active = false;
  }

  start(oldCard, newCard, direction) {
    this.old = oldCard;
    this.new = newCard;
    this.direction = direction;
    this.started = this.clock();
    this.active = true;
  }

  renderKey() {
    if (!this.active) return null;
    const elapsed = this.clock() - this.started;
    if (elapsed >= this.duration) {
      this.active = false;
      this.old = this.new = null;
      return null;
    }
    return Math.trunc(elapsed * this.fps);
  }

  /** Smoothstep progress of the card slide, or null once the slide has finished. */
  progress() {
    if (this.renderKey() == null) return null;
    const t = Math.min(1, Math.max(0, (this.clock() - this.started) / this.duration));
    return t * t * (3 - 2 * t);
  }

  sample() {
    const t = this.progress();
    if (t == null) return null;
    return { old: this.old, new: this.new, direction: this.direction, t };
  }

  stop() {
    this.active = false;
    this.old = this.new = null;
  }
}

export class IdlePlay {
  constructor(clock, inviteSeconds = 20, sleepSeconds = 300) {
    this.clock = clock;
    this.inviteSeconds = inviteSeconds;
    this.sleepSeconds = sleepSeconds;
    this.lastInput = clock();
    this.sleeping = false;
    this.peeking = false;
    this.justSlept = false;
  }

  touch() {
    this.lastInput = this.clock();
    this.sleeping = false;
    this.peeking = false;
  }

  update(held = false) {
    if (held) this.lastInput = this.clock();
    const elapsed = this.clock() - this.lastInput;
    if (elapsed >= this.sleepSeconds && !this.sleeping) {
      this.sleeping = true;
      this.justSlept = true;
    }
    this.peeking = this.inviteSeconds <= elapsed && elapsed < this.inviteSeconds + 3 && !this.sleeping;
  }

  peekProgress() {
    const age = this.clock() - this.lastInput - this.inviteSeconds;
    return Math.min(1, Math.max(0, age / 0.4), Math.max(0, (3 - age) / 0.4));
  }
}

export class LetterLesson {
  constructor(catalog, options = {}) {
    this.catalog = catalogFor(catalog);
    this.clock = options.clock ?? (() => 0);
    this.fps = options.fps ?? DRAW.fps;
    this.drawSeconds = options.drawSeconds ?? DRAW.drawSeconds;
    this.strokePause = options.strokePause ?? DRAW.strokePause;
    this.introSeconds = options.introSeconds ?? DRAW.introSeconds;
    this.holdSeconds = options.holdSeconds ?? DRAW.holdSeconds;
    this.celebrationSeconds = options.celebrationSeconds ?? DRAW.celebrationSeconds;
    this.active = null;
    this.serial = 0;
    this.timeline = [];
    this.strokes = [];
    this.ink = '#012a5f';
  }

  start(letter, audioSeconds = 0) {
    const strokes = this.catalog.strokes(letter);
    this.strokes = strokes;
    this.ink = this.catalog.ink(letter);
    const weights = strokes.map(stroke => stroke.length + 35);
    const available = Math.max(this.drawSeconds, strokes.length * 0.6);
    const total = weights.reduce((sum, weight) => sum + weight, 0);
    let cursor = this.introSeconds;
    const timeline = [];
    for (const weight of weights) {
      const duration = available * weight / total;
      timeline.push([cursor, cursor + duration]);
      cursor += duration + this.strokePause;
    }
    this.timeline = timeline;
    this.drawEnd = timeline[timeline.length - 1][1];
    this.celebrationStart = Math.max(this.drawEnd + this.holdSeconds, audioSeconds);
    this.duration = this.celebrationStart + this.celebrationSeconds;
    this.active = letter;
    this.started = this.clock();
    this.serial += 1;
  }

  stop() {
    this.active = null;
    this.strokes = [];
    this.timeline = [];
  }

  state() {
    if (this.active == null) return null;
    const now = this.clock();
    if (now >= this.started + this.duration) {
      this.stop();
      return null;
    }
    const elapsed = Math.max(0, now - this.started);
    const count = this.timeline.length;
    if (elapsed >= this.celebrationStart) {
      return ['celebrate', count, null, 1, (elapsed - this.celebrationStart) / this.celebrationSeconds];
    }
    if (elapsed >= this.drawEnd) return ['hold', count, null, 1, 0];
    for (let index = 0; index < this.timeline.length; index += 1) {
      const [start, end] = this.timeline[index];
      if (elapsed < start) {
        if (index === 0) return ['intro', 0, 0, 0, 0];
        const previousEnd = this.timeline[index - 1][1];
        const fraction = Math.max(0, Math.min(1, (elapsed - previousEnd) / (start - previousEnd)));
        return ['pause', index, index, fraction, 0];
      }
      if (elapsed < end) return ['draw', index, index, (elapsed - start) / (end - start), 0];
    }
    return null;
  }
}

export class PressGuard {
  constructor(seconds = 0.4) {
    this.seconds = seconds;
    this.last = null;
  }

  accept(now) {
    if (this.last != null && now - this.last < this.seconds) return false;
    this.last = now;
    return true;
  }
}

export class LessonCues {
  constructor() { this.nextPraise = 0; }

  listen() { return { kind: 'listen', seconds: CUES.listen }; }

  repeat() {
    const praise = this.nextPraise;
    this.nextPraise = (this.nextPraise + 1) % 2;
    const praiseSeconds = CUES.praise[praise];
    return {
      kind: 'repeat',
      praise,
      prompt: CUES.prompt,
      silence: CUES.silence,
      praiseSeconds,
      seconds: CUES.prompt + CUES.silence + praiseSeconds,
    };
  }
}

export function effectFor(button, accepted = true) {
  if (!accepted) return 'tick';
  if (button === 'left' || button === 'right') return 'whoosh';
  if (button === 'center') return 'pop';
  return 'tick';
}

function roundHalfEven(value) {
  const floor = Math.floor(value);
  const fraction = value - floor;
  if (fraction > 0.5) return floor + 1;
  if (fraction < 0.5) return floor;
  return floor % 2 === 0 ? floor : floor + 1;
}

function mul32(left, right) { return Math.imul(left, right) >>> 0; }

/** Python's random.Random(seed) for the seeded whoosh. Seed 42 is one 32-bit word. */
function pythonRandom(seed) {
  const size = 624;
  const twist = 397;
  const state = new Uint32Array(size);
  let index = size;
  function twistState() {
    for (let cursor = 0; cursor < size; cursor += 1) {
      const next = (cursor + 1) % size;
      const mixed = (state[cursor] & 0x80000000) + (state[next] & 0x7fffffff);
      const source = cursor < size - twist ? state[cursor + twist] : state[cursor + twist - size];
      state[cursor] = (source ^ (mixed >>> 1) ^ (mixed & 1 ? 0x9908b0df : 0)) >>> 0;
    }
    index = 0;
  }
  function uint32() {
    if (index >= size) twistState();
    let value = state[index];
    index += 1;
    value ^= value >>> 11;
    value ^= (value << 7) & 0x9d2c5680;
    value ^= (value << 15) & 0xefc60000;
    value ^= value >>> 18;
    return value >>> 0;
  }
  state[0] = 19650218;
  for (let cursor = 1; cursor < size; cursor += 1) {
    state[cursor] = (mul32(state[cursor - 1] ^ (state[cursor - 1] >>> 30), 1812433253) + cursor) >>> 0;
  }
  const key = [];
  let rest = seed;
  if (rest === 0) key.push(0);
  while (rest > 0) {
    key.push(rest % 4294967296);
    rest = Math.floor(rest / 4294967296);
  }
  let i = 1;
  let j = 0;
  for (let count = Math.max(size, key.length); count > 0; count -= 1) {
    const mixed = mul32(state[i - 1] ^ (state[i - 1] >>> 30), 1664525);
    state[i] = ((state[i] ^ mixed) + key[j] + j) >>> 0;
    i += 1;
    j += 1;
    if (i >= size) { state[0] = state[size - 1]; i = 1; }
    if (j >= key.length) j = 0;
  }
  for (let count = size - 1; count > 0; count -= 1) {
    const mixed = mul32(state[i - 1] ^ (state[i - 1] >>> 30), 1566083941);
    state[i] = ((state[i] ^ mixed) - i) >>> 0;
    i += 1;
    if (i >= size) { state[0] = state[size - 1]; i = 1; }
  }
  state[0] = 0x80000000;
  return {
    uniform(low, high) {
      const a = uint32() >>> 5;
      const b = uint32() >>> 6;
      const unit = (a * 67108864 + b) * (1 / 9007199254740992);
      return low + (high - low) * unit;
    },
  };
}

const effectCache = new Map();

/** One channel of app/audio.py effect_pcm, packed the way the Pi rounds it. */
export function effectSamples(name) {
  const cached = effectCache.get(name);
  if (cached) return cached;
  const duration = { whoosh: 0.075, pop: 0.045, tick: 0.025 }[name];
  const count = Math.round(48000 * duration);
  const noise = pythonRandom(42);
  const samples = new Int16Array(count);
  let filtered = 0;
  for (let i = 0; i < count; i += 1) {
    const t = i / count;
    const envelope = Math.sin(Math.PI * t) ** 2;
    let value;
    if (name === 'whoosh') {
      filtered = 0.8 * filtered + 0.2 * noise.uniform(-1, 1);
      value = filtered * 0.3;
    } else {
      const frequency = name === 'pop' ? 850 - 550 * t : 1400;
      value = Math.sin(Math.PI * 2 * frequency * i / 48000) * (name === 'pop' ? 0.16 : 0.055);
    }
    samples[i] = roundHalfEven(32767 * value * envelope);
  }
  effectCache.set(name, samples);
  return samples;
}

export function createSession({ letters, catalog, clock, pressGuard = 0.4, volume = 0.2 } = {}) {
  if (!letters?.length) throw new Error('The gallery needs at least one letter.');
  const time = clock ?? (() => 0);
  const session = {
    letters: letters.slice(),
    index: 0,
    volume,
    lastAction: 'Ready',
    held: false,
    centerSince: null,
    centerDrawn: false,
    pendingCue: null,
    audioStop: false,
    clock: time,
    hold: new HoldClock(time),
    motion: new CardMotion(time),
    idle: new IdlePlay(time),
    guard: new PressGuard(pressGuard),
    cues: new LessonCues(),
    current() { return this.letters[this.index]; },
    stopDrawing() {
      if (this.lesson.active) {
        this.lesson.stop();
        this.audioStop = true;
      }
      this.hold.hold(false);
    },
    act(button) {
      this.pendingCue = null;
      this.audioStop = false;
      if (button === 'up' || button === 'down') {
        this.stopDrawing();
        const card = this.current();
        this.motion.start(card, card, button);
        if (button === 'up') {
          this.pendingCue = this.cues.listen();
          this.lastAction = 'Listen';
        } else {
          this.pendingCue = this.cues.repeat();
          this.lastAction = 'Say it with me';
        }
        return;
      }
      if (button === 'left' || button === 'right') {
        const old = this.current();
        this.stopDrawing();
        this.audioStop = true;
        const step = button === 'left' ? -1 : 1;
        this.index = (this.index + step + this.letters.length) % this.letters.length;
        this.motion.start(old, this.current(), button);
        this.pendingCue = { ...this.cues.listen(), letter: this.current() };
        this.lastAction = button === 'left' ? 'Previous photo' : 'Next photo';
        return;
      }
      if (button === 'center') {
        this.stopDrawing();
        this.motion.stop();
        this.audioStop = true;
        this.pendingCue = { ...this.cues.listen(), letter: this.current() };
        this.lastAction = 'Listen';
        return;
      }
      if (button !== 'draw') return;
      this.motion.stop();
      this.hold.hold(true);
      const letter = this.current();
      const drawing = this.lesson.state();
      if (drawing && this.lesson.active === letter) {
        this.lastAction = `Still drawing ${letter}`;
        return;
      }
      this.audioStop = true;
      const cue = { ...this.cues.listen(), letter };
      this.pendingCue = cue;
      this.lesson.start(letter, cue.seconds);
      this.lastAction = `Drawing ${letter}`;
    },
  };
  // The pencil clock counts only while CENTER is held. Slides, idle, and the press guard use wall time.
  session.lesson = new LetterLesson(catalog, { clock: () => session.hold.now() });
  return session;
}

export function handlePress(session, button) {
  session.idle.touch();
  const accepted = session.guard.accept(session.clock());
  const effect = effectFor(button, accepted);
  if (button === 'center') {
    session.held = true;
    session.centerSince = accepted ? session.clock() : null;
    session.centerDrawn = false;
    return { accepted, effect, cue: null, audioStop: false };
  }
  if (!accepted) return { accepted: false, effect, cue: null, audioStop: false };
  session.act(button);
  return { accepted: true, effect, cue: session.pendingCue, audioStop: session.audioStop };
}

export function handleHeld(session) {
  if (session.centerSince == null || session.centerDrawn
      || session.clock() - session.centerSince < CENTER_HOLD_SECONDS) return null;
  session.centerDrawn = true;
  session.act('draw');
  return { cue: session.pendingCue, audioStop: session.audioStop };
}

export function handleRelease(session, button, cancelled = false) {
  session.idle.touch();
  if (button === 'center') {
    let result = cancelled ? null : handleHeld(session);
    if (!cancelled && session.centerSince != null && !session.centerDrawn) {
      session.act('center');
      result = { cue: session.pendingCue, audioStop: session.audioStop };
    }
    session.centerSince = null;
    session.held = false;
    session.hold.hold(false);
    return result;
  }
  return null;
}

/** What the screen shows. Sleep, peek, and a slide skip the lesson clock, matching PlayerSession.frame. */
export function frameOf(session) {
  session.idle.update(session.held);
  const slept = session.idle.justSlept;
  session.idle.justSlept = false;
  const letter = session.current();
  const base = { letter, held: session.held, slept };
  if (session.idle.sleeping) return { ...base, phase: 'sleep' };
  if (session.idle.peeking) return { ...base, phase: 'peek', progress: session.idle.peekProgress() };
  const slide = session.motion.sample();
  if (slide) return { ...base, phase: 'slide', slide };
  const lesson = session.lesson.state();
  if (lesson) {
    return {
      ...base,
      phase: lesson[0],
      lesson,
      drawLetter: session.lesson.active,
      strokes: session.lesson.strokes,
      ink: session.lesson.ink,
      serial: session.lesson.serial,
    };
  }
  return { ...base, phase: 'card' };
}
