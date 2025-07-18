console.log('✅ routes.js loaded from:', __filename);


const express = require('express');
const router = express.Router();
const postController = require('./post');
const commentController = require('./comment');
const { isAuthenticated } = require('./auth');


// 📝 게시글 라우팅
router.post('/posts', authenticateUser, postController.createPost);
router.put('/posts/:id', authenticateUser, postController.updatePost);
router.delete('/posts/:id', authenticateUser, postController.deletePost);

// 💬 댓글 라우팅
router.post('/comments', authenticateUser, commentController.createComment);
router.put('/comments/:id', authenticateUser, commentController.updateComment);
router.delete('/comments/:id', authenticateUser, commentController.deleteComment);

module.exports = router;
