import { Router } from 'express'
import multer from 'multer'
import { MediaController } from '../controllers/media.controller'
import { authenticateToken } from '../middleware/auth'
import { LocalStorageAdapter } from '../storage/local-storage-adapter'

const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB
})

const storageAdapter = new LocalStorageAdapter(
  process.env.MEDIA_STORAGE_PATH || 'storage/media',
  process.env.MEDIA_BASE_URL || 'http://localhost:3005/files'
)

const mediaController = new MediaController(storageAdapter)

const router = Router()

router.post('/upload', authenticateToken, upload.single('file'), mediaController.upload.bind(mediaController))
router.get('/media/:id', mediaController.getById.bind(mediaController))
router.get('/media', authenticateToken, mediaController.listMine.bind(mediaController))
router.delete('/media/:id', authenticateToken, mediaController.delete.bind(mediaController))

export default router
