import { app } from './server/app.js';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import express from 'express';

const PORT = 3000;

async function startServer() {
  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath, {
      maxAge: '1y',
      immutable: true,
      setHeaders: (res, filePath) => {
        if (filePath.endsWith('.html')) {
          res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
          res.setHeader('Pragma', 'no-cache');
          res.setHeader('Expires', '0');
        }
      }
    }));

    // Prevent SPA fallback for non-existent /assets/* chunks so browsers don't receive HTML for JS/CSS
    app.use('/assets', (req, res) => {
      res.status(404).setHeader('Cache-Control', 'no-store').type('text/plain').send('Asset not found');
    });

    app.get('*', (req, res) => {
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  const server = app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });

  // Cloud Run / Nginx reverse-proxy keep-alive configuration to prevent ECONNRESET
  server.keepAliveTimeout = 65000;
  server.headersTimeout = 66000;
}

process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
});

process.on('unhandledRejection', (reason) => {
  console.error('Unhandled Rejection:', reason);
});

startServer();
