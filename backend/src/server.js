import { env } from './config/env.js';
import { connectDB } from './config/db.js';
import app from './app.js';

const start = async () => {
  try {
    await connectDB();
    app.listen(env.port, () => {
      console.log(`API listening on port ${env.port} (${env.nodeEnv})`);
    });
  } catch (err) {
    console.error('Failed to start server:', err.message);
    process.exit(1);
  }
};

start();
