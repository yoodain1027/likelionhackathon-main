const express = require('express')
const router = express.Router()
const postController = require('./post')
const commentController = require('./comment')
const { isAuthenticated } = require('./auth')

// 📌 게시글 라우팅
router.post('/posts', isAuthenticated, postController.createPost)
router.put('/posts/:id', isAuthenticated, postController.updatePost)
router.delete('/posts/:id', isAuthenticated, postController.deletePost)

// 📌 댓글 라우팅
router.post('/comments', isAuthenticated, commentController.createComment)
router.put('/comments/:id', isAuthenticated, commentController.updateComment)
router.delete('/comments/:id', isAuthenticated, commentController.deleteComment)

// ✅ 댓글 전체 조회
router.get('/comments', commentController.getAllComments)

// ✅ 특정 댓글 조회
router.get('/comments/:id', commentController.getCommentById)

module.exports = router
