import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { env } from './config/env';
import messageRoutes from './routes/message.routes';

const app = express();

app.use(helmet());
app.use(cors({ origin: env.frontendUrl, credentials: true }));
app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'message-service' });
});

app.use('/api/v1', messageRoutes);

export default app;
