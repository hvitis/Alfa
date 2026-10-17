import test from 'node:test';
import assert from 'node:assert/strict';
import catalog from '../../assets/letter-drawing/letters.json' with { type: 'json' };
import config from '../../config.json' with { type: 'json' };
import {
  LetterLesson, createSession, handlePress, handleRelease, frameOf,
  letterStrokes, selectedLetters, effectFor, effectSamples, CardMotion, IdlePlay,
} from '../device-sim.js';

const settings = config.lesson;

function clockAt(start = 0) {
  let now = start;
  const clock = () => now;
  clock.set = value => { now = value; };
  clock.advance = delta => { now += delta; };
  return clock;
}

function near(actual, expected, label) {
  assert.ok(Math.abs(actual - expected) < 1e-9, `${label}: ${actual} vs ${expected}`);
}

test('selected letters follow settings order', () => {
  assert.deepEqual(selectedLetters(settings, catalog), settings.letters);
});

test('A stroke timing matches the Pi lesson', () => {
  const strokes = letterStrokes(catalog, 'A');
  near(strokes[0].length, 67.08203932499369, 'first leg');
  near(strokes[1].length, 67.08203932499369, 'second leg');
  assert.equal(strokes[2].length, 34);
  const tip = strokes[0].prefix(0.5).at(-1);
  near(tip[0], 35, 'mid x');
  near(tip[1], 50, 'mid y');

  const clock = clockAt(0);
  const lesson = new LetterLesson(catalog, { clock });
  lesson.start('A', 0);
  near(lesson.timeline[0][0], 0.5, 'intro end');
  near(lesson.timeline[0][1], 2.3685114058461947, 'stroke 1 end');
  near(lesson.timeline[1][0], 2.588511405846195, 'stroke 2 start');
  near(lesson.timeline[1][1], 4.45702281169239, 'stroke 2 end');
  near(lesson.timeline[2][0], 4.67702281169239, 'crossbar start');
  near(lesson.drawEnd, 5.94, 'draw end');
  near(lesson.celebrationStart, 6.64, 'celebration');
  near(lesson.duration, 8.44, 'duration');

  assert.equal(lesson.state()[0], 'intro');
  clock.set(0.49);
  assert.equal(lesson.state()[0], 'intro');
  clock.set(0.5);
  const started = lesson.state();
  assert.equal(started[0], 'draw');
  near(started[3], 0, 'fraction at stroke start');
  clock.set(1);
  const drawing = lesson.state();
  assert.equal(drawing[0], 'draw');
  near(drawing[3], 0.26759269353968135, 'fraction at 1s');
  clock.set(5.94);
  assert.equal(lesson.state()[0], 'hold');
  clock.set(6);
  assert.equal(lesson.state()[0], 'hold');
  clock.set(7);
  const celebrate = lesson.state();
  assert.equal(celebrate[0], 'celebrate');
  near(celebrate[4], 0.2, 'celebration progress');
  clock.set(8.44);
  assert.equal(lesson.state(), null);
  assert.equal(lesson.active, null);
});

test('a long recording delays the celebration', () => {
  const lesson = new LetterLesson(catalog, { clock: () => 0 });
  lesson.start('A', 100);
  assert.equal(lesson.celebrationStart, 100);
  assert.equal(lesson.duration, 101.8);
});

test('Ą keeps the A strokes and the ogonek', () => {
  const strokes = letterStrokes(catalog, 'Ą');
  assert.equal(strokes.length, 4);
  near(strokes[3].length, 27.185264328882994, 'ogonek');
  assert.equal(catalog.letters['Ą'].ink, '#01275e');
});

test('the pencil pauses on release and resumes without a new trace', () => {
  const clock = clockAt(0);
  const session = createSession({ letters: settings.letters, catalog, clock });
  handlePress(session, 'center');
  assert.equal(session.lastAction, `Drawing ${settings.letters[0]}`);
  assert.equal(session.lesson.serial, 1);
  clock.advance(1);
  const moving = session.lesson.state();
  assert.equal(moving[0], 'draw');
  handleRelease(session, 'center');
  clock.advance(5);
  const paused = session.lesson.state();
  assert.equal(paused[0], moving[0]);
  near(paused[3], moving[3], 'frozen fraction');
  clock.advance(0.5);
  handlePress(session, 'center');
  assert.equal(session.lesson.serial, 1);
  assert.equal(session.lastAction, `Still drawing ${settings.letters[0]}`);
  assert.equal(session.hold.isDown(), true);
});

test('right cancels a trace and wraps the letter list', () => {
  const clock = clockAt(0);
  const session = createSession({ letters: settings.letters, catalog, clock });
  handlePress(session, 'center');
  clock.advance(0.5);
  handleRelease(session, 'center');
  handlePress(session, 'right');
  assert.equal(session.current(), settings.letters[1]);
  assert.equal(session.lesson.active, null);
  assert.equal(session.lastAction, 'Next photo');
  const fresh = createSession({ letters: settings.letters, catalog, clock: clockAt(0) });
  handlePress(fresh, 'left');
  assert.equal(fresh.current(), settings.letters.at(-1));
  assert.equal(fresh.lastAction, 'Previous photo');
});

test('a guarded center press resumes the pencil and does not start another trace', () => {
  const clock = clockAt(0);
  const session = createSession({ letters: settings.letters, catalog, clock });
  handlePress(session, 'center');
  handleRelease(session, 'center');
  clock.set(0.39);
  const rejected = handlePress(session, 'center');
  assert.equal(rejected.accepted, false);
  assert.equal(rejected.effect, 'tick');
  assert.equal(session.lesson.serial, 1);
  assert.equal(session.lastAction, `Drawing ${settings.letters[0]}`);
  assert.equal(session.hold.isDown(), true);
  handleRelease(session, 'center');
  clock.set(0.4);
  const accepted = handlePress(session, 'center');
  assert.equal(accepted.accepted, true);
  assert.equal(session.lesson.serial, 1);
  assert.equal(session.lastAction, `Still drawing ${settings.letters[0]}`);
});

test('up and down play cues without changing the letter or volume', () => {
  const clock = clockAt(0);
  const session = createSession({ letters: settings.letters, catalog, clock, volume: 0.2 });
  const letter = session.current();
  const up = handlePress(session, 'up');
  assert.equal(up.cue.kind, 'listen');
  assert.equal(up.cue.seconds, 0.45);
  assert.equal(session.lastAction, 'Listen');
  assert.equal(session.current(), letter);
  assert.equal(session.volume, 0.2);
  clock.advance(0.5);
  const first = handlePress(session, 'down');
  assert.equal(first.cue.praise, 0);
  near(first.cue.seconds, 2.9, 'first praise');
  clock.advance(0.5);
  const second = handlePress(session, 'down');
  assert.equal(second.cue.praise, 1);
  near(second.cue.seconds, 3.1, 'second praise');
  assert.equal(session.lastAction, 'Say it with me');
  assert.equal(session.current(), letter);
  assert.equal(session.volume, 0.2);
  assert.equal(effectFor('left', true), 'whoosh');
  assert.equal(effectFor('center', true), 'pop');
  assert.equal(effectFor('up', true), 'tick');
  assert.equal(effectFor('left', false), 'tick');
});

test('button effects match the generated Pi sounds', () => {
  assert.equal(effectSamples('pop')[100], -108);
  assert.equal(effectSamples('tick')[100], -60);
  assert.equal(effectSamples('whoosh')[100], 4);
  assert.equal(effectSamples('whoosh')[500], -365);
  assert.equal(effectSamples('whoosh')[2000], -2042);
});

test('a card slide is halfway through its smoothstep at half duration', () => {
  const clock = clockAt(0);
  const motion = new CardMotion(clock);
  motion.start('A', 'D', 'right');
  clock.advance(0.14);
  near(motion.progress(), 0.5, 'smoothstep');
});

test('the screen peeks after 20 seconds and sleeps after 300', () => {
  const clock = clockAt(0);
  const idle = new IdlePlay(clock);
  clock.set(20);
  idle.update();
  assert.equal(idle.peeking, true);
  near(idle.peekProgress(), 0, 'peek start');
  clock.set(20.2);
  idle.update();
  near(idle.peekProgress(), 0.5, 'peek in');
  clock.set(300);
  idle.update();
  assert.equal(idle.sleeping, true);
  assert.equal(idle.peeking, false);
  idle.touch();
  assert.equal(idle.sleeping, false);

  const session = createSession({ letters: settings.letters, catalog, clock: clockAt(0) });
  handlePress(session, 'center');
  session.clock.advance(1);
  handleRelease(session, 'center');
  session.clock.advance(20);
  const peek = frameOf(session);
  assert.equal(peek.phase, 'peek');
  assert.equal(session.lesson.active, settings.letters[0]);
  session.clock.set(session.clock() + 280);
  const asleep = frameOf(session);
  assert.equal(asleep.phase, 'sleep');
  assert.equal(session.lesson.active, settings.letters[0]);
  handlePress(session, 'right');
  const awake = frameOf(session);
  assert.equal(awake.phase, 'slide');
  assert.equal(awake.letter, settings.letters[1]);
});
