import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import swaggerUi from 'swagger-ui-express';
import { config } from './config/env.js';
import { openApiSpec } from './config/swagger.js';
import authRoutes from './routes/authRoutes.js';
import categoryRoutes from './routes/categoryRoutes.js';
import transactionRoutes from './routes/transactionRoutes.js';
import uploadRoutes from './routes/uploadRoutes.js';
import adminRoutes from './routes/adminRoutes.js';

const app = express();

app.disable('x-powered-by');
if (config.isProduction) {
  app.set('trust proxy', 1);
}
app.use(helmet());
app.use(cors({
  origin(origin, callback) {
    if (!origin || config.allowedOrigins.includes(origin)) {
      callback(null, true);
      return;
    }

    callback(new Error('Origin is not allowed by CORS'));
  },
}));
app.use(express.json({ limit: '10kb' }));

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

app.use((_request, response) => {
  response.status(404).json({ error: 'Not found' });
});

app.use((error, _request, response, _next) => {
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
