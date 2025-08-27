import { Server, Socket } from 'socket.io'
import { chatRepository } from '../repo/chat.repository'

interface AuthenticatedSocket extends Socket {
  userId?: string
}

export class SocketHandler {
  private io: Server
  private userSockets = new Map<string, string>() // userId -> socketId

  constructor(io: Server) {
    this.io = io
    this.setupSocketHandlers()
  }

  private setupSocketHandlers() {
    this.io.on('connection', (socket: AuthenticatedSocket) => {
      console.log(`Socket connected: ${socket.id}`)

      socket.on('authenticate', async (data: { userId: string }) => {
        socket.userId = data.userId
        this.userSockets.set(data.userId, socket.id)
        
        // Update user presence
        await chatRepository.updatePresence(data.userId, true, socket.id)
        
        // Mark pending messages as delivered
        await chatRepository.markMessagesAsDelivered(data.userId)
        
        socket.emit('authenticated', { success: true })
      })

      socket.on('send_message', async (data: { receiverId: string; content: string }) => {
        if (!socket.userId) return socket.emit('error', { message: 'Not authenticated' })

        try {
          const message = await chatRepository.sendMessage(socket.userId, data.receiverId, data.content)
          
          // Send to sender (confirmation)
          socket.emit('message_sent', { message })
          
          // Send to receiver if online
          const receiverSocketId = this.userSockets.get(data.receiverId)
          if (receiverSocketId) {
            this.io.to(receiverSocketId).emit('new_message', { message })
            // Auto-mark as delivered since receiver is online
            await chatRepository.markMessagesAsDelivered(data.receiverId)
          }
        } catch (error) {
          socket.emit('error', { message: 'Failed to send message' })
        }
      })

      socket.on('typing_start', (data: { receiverId: string }) => {
        if (!socket.userId) return
        
        const receiverSocketId = this.userSockets.get(data.receiverId)
        if (receiverSocketId) {
          this.io.to(receiverSocketId).emit('typing_start', { senderId: socket.userId })
        }
      })

      socket.on('typing_stop', (data: { receiverId: string }) => {
        if (!socket.userId) return
        
        const receiverSocketId = this.userSockets.get(data.receiverId)
        if (receiverSocketId) {
          this.io.to(receiverSocketId).emit('typing_stop', { senderId: socket.userId })
        }
      })

      socket.on('mark_read', async (data: { messageIds: string[] }) => {
        if (!socket.userId) return

        try {
          await chatRepository.markMessagesAsRead(socket.userId, data.messageIds)
          socket.emit('marked_read', { messageIds: data.messageIds })
        } catch (error) {
          socket.emit('error', { message: 'Failed to mark as read' })
        }
      })

      socket.on('disconnect', async () => {
        console.log(`Socket disconnected: ${socket.id}`)
        
        if (socket.userId) {
          this.userSockets.delete(socket.userId)
          await chatRepository.updatePresence(socket.userId, false)
        }
      })
    })
  }
}
