import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { env } from './config/env';
import followRoutes from './routes/follow.routes';

const app = express();

app.use(helmet());
app.use(cors({ origin: env.frontendUrl, credentials: true }));
app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'social-service' });
});

app.use('/api/v1', followRoutes);

export default app;
