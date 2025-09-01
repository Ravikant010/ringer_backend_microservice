import { Response } from 'express'
import sharp from 'sharp'
import crypto from 'crypto'
import path from 'path'
import { AuthenticatedRequest } from '../middleware/auth'
import { mediaRepository } from './../repo/media.repo'
import { StorageAdapter } from '../storage/adapter'
import { ListMediaSchema, GetMediaSchema, DeleteMediaSchema } from '../validation/media.schema'

const ALLOWED_MIME_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif'])
const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB

export class MediaController {
  constructor(private storage: StorageAdapter) {}

  async upload(req: AuthenticatedRequest, res: Response) {
    try {
      const file = (req as any).file as Express.Multer.File
      if (!file) {
        return res.status(400).json({ success: false, error: 'File is required', code: 'FILE_MISSING' })
      }

      // Validate file type
      if (!ALLOWED_MIME_TYPES.has(file.mimetype)) {
        return res.status(400).json({ success: false, error: 'Unsupported file type', code: 'UNSUPPORTED_TYPE' })
      }

      // Validate file size
      if (file.size > MAX_FILE_SIZE) {
        return res.status(400).json({ success: false, error: 'File too large', code: 'FILE_TOO_LARGE' })
      }

      const ownerId = req.user!.userId

      // Check for duplicate by content hash
      const contentHash = crypto.createHash('sha256').update(file.buffer).digest('hex')
      const existingFile = await mediaRepository.findByChecksum(contentHash, ownerId)
      if (existingFile) {
        return res.json({ success: true, data: existingFile, message: 'File already exists' })
      }

      // Get image dimensions
      let width: number | undefined
      let height: number | undefined
      
      if (file.mimetype.startsWith('image/')) {
        try {
          const metadata = await sharp(file.buffer).metadata()
          width = metadata.width
          height = metadata.height
        } catch (error) {
          console.warn('Failed to extract image metadata:', error)
        }
      }

      // Generate unique filename
      const ext = path.extname(file.originalname) || '.jpg'
      const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`
      const storageKey = `${ownerId}/${new Date().getFullYear()}/${filename}`

      // Store file
      const stored = await this.storage.store({
        key: storageKey,
        buffer: file.buffer,
        mimeType: file.mimetype,
      })

      // Save metadata to database
      const media = await mediaRepository.create({
        ownerId,
        originalName: file.originalname,
        filename,
        storageKey: stored.storageKey,
        url: stored.url,
        mimeType: file.mimetype,
        fileSize: file.size,
        width,
        height,
      })

      res.status(201).json({ success: true, data: media })
    } catch (error: any) {
      console.error('Upload error:', error)
      res.status(500).json({ success: false, error: 'Upload failed', code: 'UPLOAD_FAILED' })
    }
  }

  async getById(req: AuthenticatedRequest, res: Response) {
    try {
      const { id } = GetMediaSchema.parse(req.params)
      const media = await mediaRepository.getById(id)
      
      if (!media) {
        return res.status(404).json({ success: false, error: 'Media not found', code: 'MEDIA_NOT_FOUND' })
      }

      res.json({ success: true, data: media })
    } catch (error: any) {
      res.status(400).json({ success: false, error: error.message, code: 'GET_MEDIA_FAILED' })
    }
  }

  async listMine(req: AuthenticatedRequest, res: Response) {
    try {
      const ownerId = req.user!.userId
      const { limit, cursor } = ListMediaSchema.parse(req.query)
      
      const result = await mediaRepository.listByOwner(ownerId, limit, cursor)
      
      res.json({ 
        success: true, 
        data: result.items,
        pagination: { nextCursor: result.nextCursor, hasMore: result.hasMore }
      })
    } catch (error: any) {
      res.status(400).json({ success: false, error: error.message, code: 'LIST_MEDIA_FAILED' })
    }
  }

  async delete(req: AuthenticatedRequest, res: Response) {
    try {
      const ownerId = req.user!.userId
      const { id } = DeleteMediaSchema.parse(req.params)
      
      const deleted = await mediaRepository.softDelete(id, ownerId)
      
      if (!deleted) {
        return res.status(404).json({ success: false, error: 'Media not found', code: 'MEDIA_NOT_FOUND' })
      }

      // Optionally delete from storage (commented out for safety)
      // await this.storage.delete(deleted.storageKey)

      res.json({ success: true, message: 'Media deleted successfully' })
    } catch (error: any) {
      res.status(400).json({ success: false, error: error.message, code: 'DELETE_MEDIA_FAILED' })
    }
  }
}
