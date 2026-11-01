import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { env } from './config/env.js';
import { notFound, errorHandler } from './middleware/errorHandler.js';
import authRoutes from './routes/auth.routes.js';
import userRoutes from './routes/user.routes.js';
import dashboardRoutes from './routes/dashboard.routes.js';
import leadRoutes from './routes/lead.routes.js';
import companyRoutes from './routes/company.routes.js';
import taskRoutes from './routes/task.routes.js';

const app = express();

app.use(helmet());
app.use(cors({ origin: env.clientUrls }));
app.use(express.json({ limit: '10kb' }));
if (env.nodeEnv !== 'test') app.use(morgan(env.nodeEnv === 'production' ? 'combined' : 'dev'));

app.get('/api/health', (_req, res) => res.json({ success: true, status: 'ok' }));

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/leads', leadRoutes);
app.use('/api/companies', companyRoutes);
app.use('/api/tasks', taskRoutes);

app.use(notFound);
app.use(errorHandler);

export default app;
