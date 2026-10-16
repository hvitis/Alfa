const status = document.querySelector('#load-status');
const theme = document.querySelector('#theme');
theme.addEventListener('click', () => {
  const dark = document.documentElement.dataset.theme === 'dark';
  document.documentElement.dataset.theme = dark ? 'light' : 'dark';
});
if (matchMedia('(prefers-color-scheme: dark)').matches) document.documentElement.dataset.theme = 'dark';

async function start() {
  const response = await fetch('./data/manifest.json');
  if (!response.ok) throw new Error(`Project data returned HTTP ${response.status}`);
  const data = await response.json();
  if (data.schema_version !== 1 || data.alphabet.length !== 32) throw new Error('Unsupported project data');
  let index = 0;
  let playing = false;
  let volume = Math.round(data.audio.initial_volume * 100);
  const cap = Math.round(data.audio.max_volume * 100);
  const progress = document.querySelector('#volume');
  progress.max = cap;
  function render() {
    document.querySelector('#letter').textContent = data.alphabet[index];
    document.querySelector('#playback').textContent = playing ? 'Playing · demo indicator' : 'Stopped';
    document.querySelector('[data-action="toggle"]').setAttribute('aria-pressed', String(playing));
    progress.value = volume;
    progress.textContent = `${volume}%`;
    document.querySelector('#volume-label').textContent = `${volume}%`;
  }
  function act(action) {
    if (action === 'next') index = (index + 1) % data.alphabet.length;
    if (action === 'previous') index = (index + data.alphabet.length - 1) % data.alphabet.length;
    if (action === 'up') volume = Math.min(cap, volume + 5);
    if (action === 'down') volume = Math.max(0, volume - 5);
    if (action === 'toggle') playing = !playing;
    render();
  }
  document.querySelectorAll('[data-action]').forEach(button => button.addEventListener('click', () => act(button.dataset.action)));
  document.addEventListener('keydown', event => {
    if (event.altKey || event.ctrlKey || event.metaKey || event.repeat || /INPUT|TEXTAREA|SELECT|BUTTON|A/.test(event.target.tagName)) return;
    const action = { ArrowLeft: 'previous', ArrowRight: 'next', ArrowUp: 'up', ArrowDown: 'down', ' ': 'toggle' }[event.key];
    if (action) { event.preventDefault(); act(action); }
  });
  for (const [label, value] of [['Display', `${data.display.width} × ${data.display.height}`], ['Letters', data.alphabet.length], ['Physical buttons', data.buttons], ['Volume cap', `${cap}%`]]) {
    const div = document.createElement('div');
    const term = document.createElement('dt');
    const description = document.createElement('dd');
    term.textContent = label; description.textContent = value;
    div.append(term, description); document.querySelector('#specs').append(div);
  }
  for (const part of data.hardware) {
    const row = document.createElement('tr');
    for (const value of [part.part, part.quantity, part.interface]) {
      const cell = document.createElement('td'); cell.textContent = value; row.append(cell);
    }
    document.querySelector('#hardware-list').append(row);
  }
  render();
  status.textContent = 'Ready · All showcase assets load locally. No account or hardware required.';
  document.documentElement.dataset.ready = 'true';
}
start().catch(error => {
  status.textContent = `Cannot load project data. Serve this folder with make serve. ${error.message}`;
  console.error(error);
});
