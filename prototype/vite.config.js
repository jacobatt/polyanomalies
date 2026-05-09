import { defineConfig } from 'vite';
import { readFileSync } from 'fs';
import { join } from 'path';

// The prototype's .jsx files are designed to be compiled by Babel-standalone
// in the browser at runtime (see the <script type="text/babel"> tags in
// index.html). Vite would normally hand .jsx files to esbuild, which would
// rewrite imports/exports and break the window-globals + CDN-React convention
// these files use. This middleware short-circuits that and serves them as
// raw text so Babel-standalone can do its thing.
export default defineConfig({
  server: { port: 5173, open: false, host: '127.0.0.1' },
  plugins: [
    {
      name: 'serve-jsx-raw',
      configureServer(server) {
        server.middlewares.use((req, res, next) => {
          const url = (req.url ?? '').split('?')[0];
          if (url.endsWith('.jsx')) {
            try {
              const filePath = join(server.config.root, url);
              const content = readFileSync(filePath, 'utf-8');
              res.setHeader('Content-Type', 'application/javascript');
              res.statusCode = 200;
              res.end(content);
              return;
            } catch {
              return next();
            }
          }
          next();
        });
      },
    },
  ],
});
