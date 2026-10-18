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
      let archiveJob;
      const archivePath=resolve(root,'web/.generated/cloud-radio.zip');
      function packageArchive() {
        if (archiveJob) return archiveJob;
        archiveJob=new Promise((resolveJob,reject)=>{
          const process=spawn('python3',[resolve(root,'web/archives.py'),archivePath],{cwd:root,stdio:['ignore','pipe','pipe']});
          let log='';process.stderr.on('data',chunk=>{log=(log+chunk).slice(-4000)});
          process.on('error',reject);
          process.on('close',code=>code===0?resolveJob():reject(new Error(log||'Cloud archive creation failed')));
        }).finally(()=>{archiveJob=undefined});
        return archiveJob;
      }
      // Generate the same archive on demand in development; production uses
      // the ZIP created by web/build.py, with no runtime Python dependency.
      server.middlewares.use(async(request,response,next)=>{
        if(request.url?.split('?')[0]!=='/cloud/cloud-radio.zip')return next();
        try {
          await packageArchive();
          response.setHeader('Content-Type','application/zip');
          response.setHeader('Content-Disposition','attachment; filename="cloud-radio.zip"');
          response.setHeader('Cache-Control','no-store');
          response.end(await readFile(archivePath));
        } catch(error){next(error)}
      });
      let pdfJob;
      // The preview and static site use the same original social card and PDF.
      server.middlewares.use(async(request,response,next)=>{
        const url=request.url?.split('?')[0];
        const files={
          '/og-cloud.png':['web/assets/og-cloud.png','image/png'],
          '/og-pcb.png':['web/assets/og-pcb.png','image/png'],
          '/docs/adr.pdf':['web/.generated/adr.pdf','application/pdf'],
          '/docs/plywood-assembly-guide.pdf':['web/.generated/plywood-assembly-guide.pdf','application/pdf'],
          '/docs/wiring-diagram.svg':['web/assets/wiring-diagram.svg','image/svg+xml'],
        };
        if(!files[url])return next();
        try{
          const [file,type]=files[url];
          if(url==='/docs/adr.pdf'){
            const {exportAdr}=await import('../export-pdf.mjs');
            pdfJob ||= exportAdr(resolve(root,file)).finally(()=>{pdfJob=undefined});
            await pdfJob;
          }
          if(url==='/docs/plywood-assembly-guide.pdf'){
            const {exportPlywoodGuide}=await import('../export-plywood-guide.mjs');
            pdfJob ||= exportPlywoodGuide(resolve(root,file)).finally(()=>{pdfJob=undefined});
            await pdfJob;
          }
          response.setHeader('Content-Type',type);
          response.end(await readFile(resolve(root,file)));
        }catch(error){next(error)}
      });
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
