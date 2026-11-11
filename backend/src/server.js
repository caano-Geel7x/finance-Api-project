import app from './app.js';
import { connectToDatabase } from './config/database.js';
import { config } from './config/env.js';

try {
  await connectToDatabase();

  app.listen(config.port, () => {
    console.log(`Finance Tracker API listening on port ${config.port}`);
  });
} catch (error) {
  console.error('Unable to start API because database connection failed', {
    message: error.message,
  });
  process.exitCode = 1;
}
