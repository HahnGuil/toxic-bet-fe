import {
  AngularNodeAppEngine,
  createNodeRequestHandler,
  isMainModule,
  writeResponseToNodeResponse,
} from '@angular/ssr/node';
import express from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';
import { join } from 'node:path';

const browserDistFolder = join(import.meta.dirname, '../browser');
const apiTarget = process.env['API_TARGET'] || 'http://toxic-bet-api:20000';
const authTarget = process.env['AUTH_TARGET'] || 'http://ms-auth-server:2300';

const app = express();
const angularApp = new AngularNodeAppEngine();

app.use(express.json());

/**
 * Terminal logging endpoint — receives structured log entries from the Angular client.
 */
app.post('/log', (req, res) => {
  const { level = 'info', message, data } = req.body as {
    level?: string;
    message?: string;
    data?: unknown;
  };
  const ts = new Date().toISOString();
  const prefix = `[${ts}] [${level.toUpperCase()}]`;
  if (data !== undefined) {
    console.log(prefix, message, JSON.stringify(data));
  } else {
    console.log(prefix, message);
  }
  res.status(204).end();
});

app.use(
  '/api',
  createProxyMiddleware({
    target: apiTarget,
    changeOrigin: true,
    xfwd: true,
    pathRewrite: {
      '^/api': '',
    },
  }),
);

app.use(
  '/auth-server',
  createProxyMiddleware({
    target: authTarget,
    changeOrigin: true,
    xfwd: true,
  }),
);

/**
 * Serve static files from /browser
 */
app.use(
  express.static(browserDistFolder, {
    maxAge: '1y',
    index: false,
    redirect: false,
  }),
);

/**
 * Handle all other requests by rendering the Angular application.
 */
app.use((req, res, next) => {
  angularApp
    .handle(req)
    .then((response) =>
      response ? writeResponseToNodeResponse(response, res) : next(),
    )
    .catch(next);
});

/**
 * Start the server if this module is the main entry point, or it is ran via PM2.
 * The server listens on the port defined by the `PORT` environment variable, or defaults to 4000.
 */
if (isMainModule(import.meta.url) || process.env['pm_id']) {
  const port = Number(process.env['PORT']) || 4000;
  app.listen(port, '0.0.0.0', (error?: Error) => {
  if (error) {
    throw error;
  }
  console.log(`Node Express server listening on port ${port}`);
});
}

/**
 * Request handler used by the Angular CLI (for dev-server and during build) or Firebase Cloud Functions.
 */
export const reqHandler = createNodeRequestHandler(app);
