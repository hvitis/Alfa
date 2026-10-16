import { spawn } from 'node:child_process';
import { resolve } from 'node:path';
import { readFile } from 'node:fs/promises';

export function cloudDevelopment(root) {
  return {
    name: 'cloud-cad-development',
    apply: 'serve',
    configureServer(server) {
      const sources = ['parameters.json', 'build.py', 'README.md', 'run-cad.sh'].map(name => resolve(root, 'design/cloud-radio', name));
      server.watcher.add(sources);
      let timer, child, pending = false, closed = false;
      const send = (event, data = {}) => server.ws.send({ type: 'custom', event, data });
      function rebuild() {
        if (closed) return;
        if (child) { pending = true; return; }
        send('cloud:building');
        let log = '';
        child = spawn('bash', [resolve(root, 'design/cloud-radio/run-cad.sh')], {
          cwd: root, env: { ...process.env, UV_OFFLINE: '1' }, stdio: ['ignore', 'pipe', 'pipe'],
        });
        const output = chunk => { log = (log + chunk).slice(-10000); };
        child.stdout.on('data', output); child.stderr.on('data', output);
        child.on('error', error => { log += error.message; });
        child.on('close', code => {
          child = undefined;
          if (closed) return;
          if (code === 0) {
            server.config.logger.info('Cloud CAD rebuilt and verified.');
            send('cloud:ready');
          } else {
            server.config.logger.error(log);
            send('cloud:error', { message: 'Geometry checks or CAD generation failed. Last valid model retained. See the terminal and design/cloud-radio/last-failed-verification.json.' });
          }
          if (pending) { pending = false; rebuild(); }
        });
      }
      const changed = file => {
        if (!sources.includes(resolve(file))) return;
        clearTimeout(timer); timer = setTimeout(rebuild, 350);
      };
      server.watcher.on('change', changed);
      // Match the production manifest URL during Vite development.
      server.middlewares.use(async (request, response, next) => {
        if (request.url?.split('?')[0] !== '/data/manifest.json') return next();
        try {
          response.setHeader('Content-Type', 'application/json');
          response.end(await readFile(resolve(root, 'web/.generated/manifest.json')));
        } catch (error) { next(error); }
      });
      server.httpServer?.once('close', () => {
        closed = true; clearTimeout(timer); child?.kill('SIGTERM');
        server.watcher.off('change', changed);
      });
    },
  };
}
