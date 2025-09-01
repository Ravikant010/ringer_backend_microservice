import { Router } from 'express'
import { searchController } from '../controllers/search.controller'

const router = Router()

// Public search endpoints
router.get('/users', searchController.searchUsers.bind(searchController))
router.get('/posts', searchController.searchPosts.bind(searchController))

// Webhook endpoints for data sync (should be protected with service-to-service auth)
router.post('/sync/user', searchController.syncUser.bind(searchController))
router.post('/sync/post', searchController.syncPost.bind(searchController))

export default router
