import config from '../config.json' with { type: 'json' };
import letterData from '../assets/letter-drawing/letters.json' with { type: 'json' };
import { t } from './i18n.js';
import {
  SCREEN, createSession, effectSamples, frameOf, handleHeld, handlePress, handleRelease, selectedLetters,
} from './device-sim.js';

const settings = config.lesson;

const SCALE = Math.min(SCREEN.width / 96, SCREEN.height / 128);
const STROKE = Math.max(6, Math.round(SCALE * 6.4));
const KEYS = {
  ArrowLeft: 'left', ArrowRight: 'right', ArrowUp: 'up', ArrowDown: 'down',
  a: 'left', A: 'left', d: 'right', D: 'right', w: 'up', W: 'up', s: 'down', S: 'down',
  ' ': 'center', Enter: 'center',
};
const PHASE_KEY = {
  card: 'play.phase.card',
  slide: 'play.phase.slide',
  peek: 'play.phase.peek',
  sleep: 'play.phase.sleep',
  intro: 'play.phase.intro',
  draw: 'play.phase.draw',
  pause: 'play.phase.paused',
  hold: 'play.phase.bravo',
  celebrate: 'play.phase.bravo',
};

let api = null;

function point([x, y]) {
  return [SCREEN.width / 2 + (x - 50) * SCALE, SCREEN.height * 0.14 + y * SCALE];
}

function caption(ctx, text, y, size, color) {
  ctx.fillStyle = color;
  ctx.font = `800 ${size}px "Arial Rounded MT Bold", "Trebuchet MS", Verdana, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.fillText(text, SCREEN.width / 2, y);
}

function trace(ctx, points, color) {
  const mapped = points.map(point);
  ctx.beginPath();
  mapped.forEach(([x, y], index) => (index ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
  ctx.strokeStyle = color;
  ctx.lineWidth = STROKE;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.stroke();
}

function cloud(ctx) {
  ctx.save();
  ctx.translate(178, 46);
  ctx.fillStyle = '#d7ecff';
  ctx.strokeStyle = '#39305b';
  ctx.lineWidth = 3;
  ctx.beginPath();
  for (const [x, y, radius] of [[-16, 8, 15], [2, -4, 19], [20, 8, 13], [2, 14, 11]]) {
    ctx.moveTo(x + radius, y);
    ctx.arc(x, y, radius, 0, Math.PI * 2);
  }
  ctx.fill();
  ctx.stroke();
  ctx.restore();
}

function paintCard(ctx, letter, ink) {
  ctx.fillStyle = '#fffdf5';
  ctx.fillRect(0, 0, SCREEN.width, SCREEN.height);
  cloud(ctx);
  ctx.fillStyle = 'rgba(57, 48, 91, 0.08)';
  ctx.beginPath();
  ctx.ellipse(120, 270, 52, 9, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = ink;
  ctx.font = '800 128px "Arial Rounded MT Bold", "Trebuchet MS", Verdana, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(letter, 120, 186);
}

function drawPencil(ctx, tip) {
  const direction = tip[1] < 85 ? 1 : -1;
  const axis = [0.55, direction * 0.835];
  const normal = [-axis[1], axis[0]];
  const parts = [
    [[11, -5], [36, -5], [36, 5], [11, 5], '#efbc42', '#a97329'],
    [[12, -4], [36, -4], [36, -1], [12, -1], '#ffe391', null],
    [[12, 2], [36, 2], [36, 4], [12, 4], '#d99930', null],
    [[0, 0], [11, -5], [11, 5], '#e9c799', '#ae895c'],
    [[0, 0], [5, -2], [5, 2], '#25313b', null],
    [[36, -5], [39, -5], [39, 5], [36, 5], '#bdc8cf', '#7b8c98'],
    [[39, -5], [44, -5], [46, -3], [46, 3], [44, 5], [39, 5], '#e98e91', '#b66370'],
  ];
  for (const part of parts) {
    const outline = part.at(-1);
    const fill = part.at(-2);
    ctx.beginPath();
    part.slice(0, -2).forEach(([along, across], index) => {
      const x = tip[0] + axis[0] * along + normal[0] * across;
      const y = tip[1] + axis[1] * along + normal[1] * across;
      if (index === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.closePath();
    ctx.fillStyle = fill;
    ctx.fill();
    if (outline) {
      ctx.lineWidth = 1;
      ctx.strokeStyle = outline;
      ctx.stroke();
    }
  }
}

function fireworks(ctx, progress) {
  const colors = ['#e77970', '#e5b947', '#63a99a', '#a890bd'];
  const bursts = [[0.1, 0.22, 0], [0.89, 0.31, 0.12], [0.1, 0.72, 0.26], [0.89, 0.76, 0.38]];
  const background = [255, 253, 245];
  bursts.forEach(([cx, cy, delay], burst) => {
    const age = (progress - delay) / 0.58;
    if (age < 0 || age > 1) return;
    const radius = (4 + 19 * Math.sin(age * Math.PI / 2)) * SCREEN.width / 240;
    const fade = Math.max(0, (age - 0.58) / 0.42);
    const rgb = colors[burst].match(/[0-9a-f]{2}/gi).map(hex => parseInt(hex, 16));
    const color = rgb.map((channel, index) => Math.round(channel + (background[index] - channel) * fade));
    const fill = `rgb(${color.join(',')})`;
    for (let ray = 0; ray < 8; ray += 1) {
      const angle = ray * Math.PI * 2 / 8 + burst * 0.23;
      const dx = Math.cos(angle);
      const dy = Math.sin(angle);
      const x = cx * SCREEN.width;
      const y = cy * SCREEN.height;
      const tail = Math.max(0, radius - 6 * (1 - age));
      ctx.beginPath();
      ctx.moveTo(x + dx * tail, y + dy * tail);
      ctx.lineTo(x + dx * radius, y + dy * radius);
      ctx.strokeStyle = fill;
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.fillStyle = fill;
      ctx.beginPath();
      ctx.arc(x + dx * radius, y + dy * radius, 1, 0, Math.PI * 2);
      ctx.fill();
    }
  });
}

function statusText(session, phase) {
  if (phase === 'sleep') return t('play.asleep');
  const action = session.lastAction;
  const letter = session.current();
  if (phase === 'celebrate' || phase === 'hold') return t('play.phase.bravo', { letter });
  if (phase === 'draw' || phase === 'intro' || phase === 'pause') {
    if (action.startsWith('Still drawing ')) return t('play.still', { letter: action.slice('Still drawing '.length) });
    if (action.startsWith('Drawing ')) return t('play.drawing', { letter: action.slice('Drawing '.length) });
  }
  if (action === 'Ready' || action.startsWith('Still drawing ') || action.startsWith('Drawing ')) {
    return t('play.ready', { letter });
  }
  const keys = {
    'Previous photo': 'play.action.previous',
    'Next photo': 'play.action.next',
    Listen: 'play.action.listen',
    'Say it with me': 'play.action.say',
    'No drawing for this card': 'play.action.none',
  };
  return `${letter} · ${keys[action] ? t(keys[action]) : action}`;
}

export function mountDevice(root) {
  if (!root) throw new Error('Missing device tile');
  if (api?.root === root) return api;

  const letters = selectedLetters(settings, letterData);
  const session = createSession({
    letters,
    catalog: letterData,
    clock: () => performance.now() / 1000,
    volume: 0.2,
  });
  const canvas = root.querySelector('#device-screen');
  const ctx = canvas.getContext('2d');
  canvas.width = SCREEN.width * 2;
  canvas.height = SCREEN.height * 2;
  const status = root.querySelector('#device-status');
  const cards = new Map();
  let guide = null;
  let guideSerial = -1;
  let audio = null;
  let speech = [];
  let buffers = null;
  let source = null;
  let downName = null;
  let downEl = null;
  let heldKey = null;
  let running = false;
  let frameHandle = 0;

  function cardOf(letter) {
    let bitmap = cards.get(letter);
    if (bitmap) return bitmap;
    bitmap = document.createElement('canvas');
    bitmap.width = SCREEN.width * 2;
    bitmap.height = SCREEN.height * 2;
    const card = bitmap.getContext('2d');
    card.setTransform(2, 0, 0, 2, 0, 0);
    paintCard(card, letter, letterData.letters[letter].ink ?? '#012a5f');
    cards.set(letter, bitmap);
    return bitmap;
  }

  function lessonGuide(frame) {
    if (guide && guideSerial === frame.serial) return guide;
    guideSerial = frame.serial;
    guide = document.createElement('canvas');
    guide.width = SCREEN.width * 2;
    guide.height = SCREEN.height * 2;
    const layer = guide.getContext('2d');
    layer.setTransform(2, 0, 0, 2, 0, 0);
    layer.fillStyle = '#fffdf5';
    layer.fillRect(0, 0, SCREEN.width, SCREEN.height);
    for (const stroke of frame.strokes) trace(layer, stroke.points, '#dce3ee');
    caption(layer, 'Rysujemy', 15, 17, frame.ink);
    return guide;
  }

  function drawLesson(frame) {
    const [, completed, current, fraction, celebration] = frame.lesson;
    ctx.drawImage(lessonGuide(frame), 0, 0, SCREEN.width, SCREEN.height);
    if (frame.phase === 'celebrate') fireworks(ctx, celebration);
    frame.strokes.slice(0, completed).forEach(stroke => trace(ctx, stroke.points, frame.ink));
    if (current != null) {
      const stroke = frame.strokes[current];
      let tip;
      if (frame.phase === 'pause') {
        const previous = frame.strokes[current - 1].points.at(-1);
        const following = stroke.points[0];
        const ease = fraction * fraction * (3 - 2 * fraction);
        tip = [previous[0] + (following[0] - previous[0]) * ease, previous[1] + (following[1] - previous[1]) * ease];
      } else {
        const points = stroke.prefix(frame.phase === 'draw' ? fraction : 0);
        if (frame.phase === 'draw' && fraction) trace(ctx, points, frame.ink);
        tip = points.at(-1);
      }
      drawPencil(ctx, point(tip));
    }
    const bottom = frame.phase === 'hold' || frame.phase === 'celebrate'
      ? 'Brawo!'
      : `Kreska ${Math.min(frame.strokes.length, (current ?? 0) + 1)} z ${frame.strokes.length}`;
    caption(ctx, bottom, SCREEN.height - 27, 15, frame.ink);
  }

  function drawSlide(slide) {
    const travel = { left: [-SCREEN.width, 0], right: [SCREEN.width, 0], up: [0, -SCREEN.height], down: [0, SCREEN.height] };
    const [dx, dy] = travel[slide.direction];
    ctx.fillStyle = '#fffdf5';
    ctx.fillRect(0, 0, SCREEN.width, SCREEN.height);
    ctx.drawImage(cardOf(slide.old), Math.round(-dx * slide.t), Math.round(-dy * slide.t), SCREEN.width, SCREEN.height);
    ctx.drawImage(cardOf(slide.new), Math.round(dx * (1 - slide.t)), Math.round(dy * (1 - slide.t)), SCREEN.width, SCREEN.height);
  }

  function draw(frame) {
    ctx.setTransform(2, 0, 0, 2, 0, 0);
    if (frame.phase === 'sleep') {
      ctx.fillStyle = '#000';
      ctx.fillRect(0, 0, SCREEN.width, SCREEN.height);
      return;
    }
    if (frame.phase === 'peek') {
      const bitmap = cardOf(frame.letter);
      ctx.drawImage(bitmap, 0, 0, SCREEN.width, SCREEN.height);
      const size = SCREEN.width / 2;
      const x = SCREEN.width - Math.round(size * frame.progress);
      const y = SCREEN.height - size - 12;
      ctx.save();
      ctx.beginPath();
      ctx.rect(0, 0, SCREEN.width, SCREEN.height);
      ctx.clip();
      ctx.drawImage(bitmap, SCREEN.width / 3 * 2, 0, SCREEN.width / 3 * 2, SCREEN.height, x, y, size, size);
      ctx.restore();
      return;
    }
    if (frame.phase === 'slide') {
      drawSlide(frame.slide);
      return;
    }
    if (frame.lesson) {
      drawLesson(frame);
      return;
    }
    ctx.drawImage(cardOf(frame.letter), 0, 0, SCREEN.width, SCREEN.height);
  }

  function paint() {
    const frame = frameOf(session);
    if (frame.slept) stopSpeech();
    draw(frame);
    canvas.dataset.ready = 'true';
    canvas.dataset.letter = frame.letter;
    canvas.dataset.phase = frame.phase;
    canvas.dataset.held = String(frame.held);
    const label = t(PHASE_KEY[frame.phase] ?? 'play.phase.card', { letter: frame.letter });
    if (canvas.getAttribute('aria-label') !== label) canvas.setAttribute('aria-label', label);
    const text = statusText(session, frame.phase);
    if (status.textContent !== text) status.textContent = text;
  }

  function ensureAudio() {
    const Context = window.AudioContext || window.webkitAudioContext;
    if (!Context) return null;
    try {
      audio ??= new Context();
    } catch {
      return null;
    }
    audio.resume().catch(() => {});
    return audio;
  }

  function stopSpeech() {
    for (const node of speech) {
      try { node.stop(); } catch { /* The tone already ended. */ }
    }
    speech = [];
  }

  function tone(context, frequency, when, duration) {
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(frequency, when);
    gain.gain.setValueAtTime(0, when);
    gain.gain.linearRampToValueAtTime(0.07, when + 0.03);
    gain.gain.setValueAtTime(0.07, when + Math.max(0.04, duration - 0.05));
    gain.gain.linearRampToValueAtTime(0, when + duration);
    oscillator.connect(gain).connect(context.destination);
    oscillator.start(when);
    oscillator.stop(when + duration + 0.02);
    speech.push(oscillator);
  }

  function playCue(cue) {
    const context = ensureAudio();
    if (!context) return;
    stopSpeech();
    const start = context.currentTime + 0.02;
    if (cue.kind === 'listen') {
      tone(context, 523.25, start, 0.2);
      tone(context, 659.25, start + 0.22, 0.23);
      return;
    }
    tone(context, 392, start, cue.prompt);
    const praiseAt = start + cue.prompt + cue.silence;
    if (cue.praise === 0) {
      tone(context, 523.25, praiseAt, 0.22);
      tone(context, 659.25, praiseAt + 0.26, 0.24);
    } else {
      tone(context, 440, praiseAt, 0.18);
      tone(context, 554.37, praiseAt + 0.22, 0.2);
      tone(context, 659.25, praiseAt + 0.44, 0.26);
    }
  }

  function playEffect(name) {
    const context = ensureAudio();
    if (!context) return;
    buffers ??= new Map();
    let buffer = buffers.get(name);
    if (!buffer) {
      const pcm = effectSamples(name);
      buffer = context.createBuffer(1, pcm.length, 48000);
      const channel = buffer.getChannelData(0);
      for (let index = 0; index < pcm.length; index += 1) channel[index] = pcm[index] / 32768;
      buffers.set(name, buffer);
    }
    const player = context.createBufferSource();
    player.buffer = buffer;
    player.connect(context.destination);
    player.start();
  }

  function gesture(result) {
    if (!result) return;
    if (result.audioStop && !result.cue) stopSpeech();
    if (result.cue) playCue(result.cue);
    if (result.effect) playEffect(result.effect);
    paint();
  }

  function press(name) {
    ensureAudio();
    gesture(handlePress(session, name));
  }

  function release(name, cancelled) {
    gesture(handleRelease(session, name, cancelled));
    paint();
  }

  function clearHold(cancelled = false) {
    if (!source) return;
    const name = downName;
    source = null;
    heldKey = null;
    downEl?.setAttribute('aria-pressed', 'false');
    downEl = null;
    downName = null;
    if (name) release(name, cancelled);
  }

  for (const button of root.querySelectorAll('[data-button]')) {
    button.addEventListener('pointerdown', event => {
      if (!running || source || event.button !== 0) return;
      source = 'pointer';
      downName = button.dataset.button;
      downEl = button;
      try { button.setPointerCapture(event.pointerId); } catch { /* Ignore synthetic or unsupported pointer capture. */ }
      button.setAttribute('aria-pressed', 'true');
      press(downName);
    });
    const finish = event => {
      if (source !== 'pointer' || downEl !== button) return;
      if (event.type === 'pointerup' && event.button !== 0) return;
      clearHold(event.type === 'pointercancel');
    };
    button.addEventListener('pointerup', finish);
    button.addEventListener('pointercancel', finish);
  }

  root.addEventListener('keydown', event => {
    if (!running || !root.contains(document.activeElement)) return;
    const name = KEYS[event.key];
    if (!name) return;
    event.preventDefault();
    if (event.repeat || source) return;
    source = 'key';
    heldKey = event.key;
    downName = name;
    downEl = root.querySelector(`[data-button="${name}"]`);
    downEl?.setAttribute('aria-pressed', 'true');
    press(name);
  });
  document.addEventListener('keyup', event => {
    if (source !== 'key' || event.key !== heldKey) return;
    clearHold();
  });
  window.addEventListener('blur', () => {
    clearHold(true);
  });

  function loop() {
    if (!running) return;
    gesture(handleHeld(session));
    paint();
    frameHandle = requestAnimationFrame(loop);
  }

  function setActive(on) {
    if (on === running) return;
    running = on;
    if (!on) {
      cancelAnimationFrame(frameHandle);
      clearHold(true);
      stopSpeech();
      return;
    }
    paint();
    frameHandle = requestAnimationFrame(loop);
  }

  paint();
  api = { root, setActive };
  return api;
}
