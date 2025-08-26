import { Router } from 'express'
import { commentController } from '../controllers/comment.controller'
import { authenticateToken } from '../middleware/auth'

const router = Router()

router.post('/comments', authenticateToken, commentController.create.bind(commentController))
router.get('/comments/:id', commentController.getById.bind(commentController))
router.get('/comments', commentController.list.bind(commentController))
router.post('/comments/:id/like', authenticateToken, commentController.like.bind(commentController))
router.delete('/comments/:id/like', authenticateToken, commentController.unlike.bind(commentController))

export default router
