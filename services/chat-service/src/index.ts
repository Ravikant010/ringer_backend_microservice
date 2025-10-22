import { createServer } from 'http';
import { Server } from 'socket.io';
import app from './app';
import { SocketHandler } from './socket/socketHandler';
import { logger } from './utils/logger';

const PORT = Bun.env.PORT || 3003;

// ✅ Export socketHandler instance so controller can access it
export let socketHandler: SocketHandler;

async function startServer() {
  try {
    // Create HTTP server from Express app
    const httpServer = createServer(app);

    // Initialize Socket.IO
    const io = new Server(httpServer, {
      cors: {
        origin: Bun.env.FRONTEND_URL ?? 'http://localhost:3000',
        credentials: true,
      },
      transports: ['websocket', 'polling'],
    });

    // ✅ Initialize and export Socket Handler
    socketHandler = new SocketHandler(io);

    // Start server (HTTP + WebSocket)
    httpServer.listen(PORT, () => {
      logger.info(`chat-service running on port ${PORT}`);
      logger.info(`Socket.IO enabled on port ${PORT}`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();
