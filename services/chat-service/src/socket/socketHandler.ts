import { Server, Socket } from 'socket.io';
import { chatRepository } from '../repo/chat.repository';

interface AuthenticatedSocket extends Socket {
  userId?: string;
}

export class SocketHandler {
  private io: Server;
  private userSockets = new Map<string, string>(); // userId -> socketId

  constructor(io: Server) {
    this.io = io;
    this.setupSocketHandlers();
  }

  // ✅ Add method to get IO instance and emit to users
  public emitToUser(userId: string, event: string, data: any): boolean {
    const socketId = this.userSockets.get(userId);
    if (socketId) {
      this.io.to(socketId).emit(event, data);
      console.log(`📤 Emitted '${event}' to user ${userId}`);
      return true;
    }
    console.log(`⚠️ User ${userId} not connected`);
    return false;
  }

  private setupSocketHandlers() {
    this.io.on('connection', (socket: AuthenticatedSocket) => {
      console.log(`✅ Socket connected: ${socket.id}`);

      socket.on('authenticate', async (data: { userId: string }) => {
        try {
          if (!data?.userId || typeof data.userId !== 'string') {
            console.error('❌ Invalid userId in authenticate event:', data);
            return socket.emit('error', { message: 'Valid userId is required' });
          }

          socket.userId = data.userId;
          this.userSockets.set(data.userId, socket.id);

          console.log(`✅ User authenticated: ${data.userId} (socket: ${socket.id})`);

          await chatRepository.updatePresence(data.userId, true, socket.id);
          await chatRepository.markMessagesAsDelivered(data.userId);

          socket.emit('authenticated', { success: true });
        } catch (error) {
          console.error('❌ Authentication error:', error);
          socket.emit('error', { message: 'Authentication failed' });
        }
      });

      socket.on('send_message', async (data: { receiverId: string; content: string }) => {
        if (!socket.userId) {
          return socket.emit('error', { message: 'Not authenticated' });
        }

        try {
          const message = await chatRepository.sendMessage(socket.userId, data.receiverId, data.content);

          socket.emit('message_sent', { message });

          const receiverSocketId = this.userSockets.get(data.receiverId);
          if (receiverSocketId) {
            this.io.to(receiverSocketId).emit('new_message', { message });
            await chatRepository.markMessagesAsDelivered(data.receiverId);
          }
        } catch (error) {
          console.error('❌ Send message error:', error);
          socket.emit('error', { message: 'Failed to send message' });
        }
      });

      socket.on('typing_start', (data: { receiverId: string }) => {
        if (!socket.userId) return;

        const receiverSocketId = this.userSockets.get(data.receiverId);
        if (receiverSocketId) {
          this.io.to(receiverSocketId).emit('typing_start', { senderId: socket.userId });
        }
      });

      socket.on('typing_stop', (data: { receiverId: string }) => {
        if (!socket.userId) return;

        const receiverSocketId = this.userSockets.get(data.receiverId);
        if (receiverSocketId) {
          this.io.to(receiverSocketId).emit('typing_stop', { senderId: socket.userId });
        }
      });

      socket.on('mark_read', async (data: { messageIds: string[] }) => {
        if (!socket.userId) return;

        try {
          await chatRepository.markMessagesAsRead(socket.userId, data.messageIds);
          socket.emit('marked_read', { messageIds: data.messageIds });
        } catch (error) {
          console.error('❌ Mark read error:', error);
          socket.emit('error', { message: 'Failed to mark as read' });
        }
      });

      socket.on('disconnect', async () => {
        console.log(`🔌 Socket disconnected: ${socket.id}`);

        if (socket.userId) {
          this.userSockets.delete(socket.userId);
          try {
            await chatRepository.updatePresence(socket.userId, false);
          } catch (error) {
            console.error('❌ Error updating presence on disconnect:', error);
          }
        }
      });
    });
  }
}
