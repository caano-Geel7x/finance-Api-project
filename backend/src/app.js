import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import { existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import swaggerUi from 'swagger-ui-express';
import { config } from './config/env.js';
import { openApiSpec } from './config/swagger.js';
import authRoutes from './routes/authRoutes.js';
import categoryRoutes from './routes/categoryRoutes.js';
import transactionRoutes from './routes/transactionRoutes.js';
import uploadRoutes from './routes/uploadRoutes.js';
import adminRoutes from './routes/adminRoutes.js';

const app = express();
const frontendDist = resolve(dirname(fileURLToPath(import.meta.url)), '../../frontend/dist');
const frontendIndex = resolve(frontendDist, 'index.html');
const frontendIsBuilt = existsSync(frontendIndex);

app.disable('x-powered-by');
if (config.isProduction) {
  app.set('trust proxy', 1);
}
app.use(helmet());
const corsMiddleware = cors({
  origin(origin, callback) {
    if (!origin || config.allowedOrigins.includes(origin)) {
      callback(null, true);
      return;
    }

    callback(new Error('Origin is not allowed by CORS'));
  },
});
app.use((request, response, next) => {
  const origin = request.get('origin');
  const requestOrigin = `${request.protocol}://${request.get('host')}`;
  if (origin && origin === requestOrigin) {
    next();
    return;
  }
  corsMiddleware(request, response, next);
});
app.use(express.json({ limit: '10kb' }));

if (frontendIsBuilt) {
  app.use(express.static(frontendDist));
}

app.get('/health', (_request, response) => {
  response.status(200).json({ status: 'ok' });
});

app.get('/docs/openapi.json', (_request, response) => {
  response.status(200).json(openApiSpec);
});
app.use('/docs', swaggerUi.serve, swaggerUi.setup(openApiSpec, {
  swaggerOptions: { persistAuthorization: false },
}));

app.use('/auth', authRoutes);
app.use('/categories', categoryRoutes);
app.use('/transactions', transactionRoutes);
app.use('/upload', uploadRoutes);
app.use('/admin', adminRoutes);

if (frontendIsBuilt) {
  const serveFrontend = (_request, response, next) => {
    response.sendFile(frontendIndex, (error) => {
      if (error) next(error);
    });
  };

  app.get(['/login', '/register'], serveFrontend);
  app.use('/app', (request, response, next) => {
    if (request.method !== 'GET') {
      next();
      return;
    }

    serveFrontend(request, response, next);
  });
}

app.use((_request, response) => {
  response.status(404).json({ error: 'Not found' });
});

app.use((error, _request, response, _next) => {
  if (response.headersSent) {
    _next(error);
    return;
  }

  if (error.code === 'LIMIT_FILE_SIZE') {
    response.status(413).json({ error: 'Image must be 5 MB or smaller' });
    return;
  }

  if (error.code === 'LIMIT_UNEXPECTED_FILE' || error.code === 'LIMIT_FILE_COUNT') {
    response.status(400).json({ error: 'Only one image file is allowed' });
    return;
  }

  if (error.message === 'Origin is not allowed by CORS') {
    response.status(403).json({ error: 'Request origin is not allowed' });
    return;
  }

  if (error instanceof SyntaxError && 'body' in error) {
    response.status(400).json({ error: 'Invalid JSON body' });
    return;
  }

  if (error.type === 'entity.too.large') {
    response.status(413).json({ error: 'Request body is too large' });
    return;
  }

  if (Number.isInteger(error.status) && error.status >= 400 && error.status < 500) {
    response.status(error.status).json({ error: error.message });
    return;
  }

  if (config.isProduction) {
    console.error('Unhandled request error');
  } else {
    console.error('Unhandled request error', {
      message: error.message,
      stack: error.stack,
    });
  }
  response.status(500).json({ error: 'Internal server error' });
});

export default app;
