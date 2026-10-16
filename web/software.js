import mermaid from 'mermaid';

export async function renderArchitecture(container, definition, {
  id = 'radio-software-architecture',
  label = 'Raspberry Pi software architecture: startup, calibrated input, player state, display, audio, simulation, and service supervision.',
} = {}) {
  mermaid.initialize({
    startOnLoad: false,
    securityLevel: 'strict',
    theme: 'base',
    fontFamily: 'system-ui, sans-serif',
    themeVariables: {
      primaryColor: '#e8ddff', primaryTextColor: '#39305b', primaryBorderColor: '#8b7bad',
      lineColor: '#75678f', secondaryColor: '#fff0ae', tertiaryColor: '#e1f5eb',
      clusterBkg: '#fcf8ff', clusterBorder: '#c9bbdf', fontSize: '13px',
    },
    flowchart: { htmlLabels: false, curve: 'basis', padding: 17, nodeSpacing: 25, rankSpacing: 38 },
  });
  const { svg, bindFunctions } = await mermaid.render(id, definition);
  container.innerHTML = svg;
  bindFunctions?.(container);
  const graphic = container.querySelector('svg');
  graphic.setAttribute('role', 'img');
  graphic.setAttribute('aria-label', label);
  container.setAttribute('aria-busy', 'false');
  container.dataset.rendered = 'true';
}
