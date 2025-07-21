const express = require('express');
const router = express.Router();
const postController = require('./post');
const commentController = require('./comment');
const { isAuthenticated } = require('./auth'); 

// 📌 게시글 라우팅
router.post('/posts', isAuthenticated, postController.createPost);
router.put('/posts/:id', isAuthenticated, postController.updatePost);
router.delete('/posts/:id', isAuthenticated, postController.deletePost);
router.get('/posts', postController.getAllPosts);        
router.get('/posts/:id', postController.getPostById);    

// 📌 댓글 라우팅
router.post('/comments', isAuthenticated, commentController.createComment);
router.put('/comments/:id', isAuthenticated, commentController.updateComment);
router.delete('/comments/:id', isAuthenticated, commentController.deleteComment);
router.get('/comments', commentController.getAllComments);
router.get('/comments/:id', commentController.getCommentById);

module.exports = router;
