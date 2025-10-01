import { Router } from 'express'
import { postController } from '../controllers/post.controller'
import { authenticateToken } from '../middleware/auth.middleware'

const router = Router()
router.get('/posts/feed', postController.listAll.bind(postController))
router.post('/posts', authenticateToken, postController.create.bind(postController))
router.get('/posts/:id', postController.getById.bind(postController))
router.get('/posts', postController.listByAuthor.bind(postController))
router.post('/posts/:id/like', authenticateToken, postController.like.bind(postController))
router.delete('/posts/:id/like', authenticateToken, postController.unlike.bind(postController))



export default router
