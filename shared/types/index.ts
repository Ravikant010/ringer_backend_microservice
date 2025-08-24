// Common types shared across services
export interface BaseEntity {
  id: string
  createdAt: Date
  updatedAt: Date
}

export interface User extends BaseEntity {
  username: string
  email: string
  avatar?: string
  bio?: string
  isOnline: boolean
  lastSeen?: Date
}

export interface Post extends BaseEntity {
  authorId: string
  content: string
  mediaFiles?: MediaFile[]
  likesCount: number
  commentsCount: number
}

export interface Comment extends BaseEntity {
  postId: string
  authorId: string
  parentId?: string
  content: string
  likesCount: number
}

export interface MediaFile extends BaseEntity {
  filename: string
  originalName: string
  url: string
  type: 'image' | 'video' | 'document'
  size: number
  mimetype: string
}

export interface ChatMessage extends BaseEntity {
  chatId: string
  senderId: string
  content: string
  messageType: 'text' | 'image' | 'file'
  fileUrl?: string
  readBy: string[]
}

export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  message?: string
  pagination?: {
    page: number
    limit: number
    total: number
    pages: number
  }
}

export interface EventMessage {
  type: string
  data: any
  timestamp: string
  userId?: string
  serviceId: string
  correlationId: string
}
