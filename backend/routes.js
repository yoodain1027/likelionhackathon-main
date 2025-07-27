const express = require('express');
const router = express.Router();
const postController = require('./post');
const commentController = require('./comment');
const { isAuthenticated } = require('./auth');
const pool = require('./mysql'); //  DB 연결 모듈 추가

//  DB 연결 확인용 API
router.get('/ping-db', (req, res) => {
  pool.query('SELECT 1 + 1 AS result', (err, results) => {
    if (err) {
      console.error(' DB 연결 실패:', err.message);
      return res.status(500).send('DB 연결 실패!');
    }
    console.log(' DB 연결 성공!');
    res.send('DB 연결 성공! 결과: ' + results[0].result); // → "2"가 반환되면 OK
  });
});

//  게시글 라우팅
router.post('/posts', isAuthenticated, postController.createPost);
router.put('/posts/:id', isAuthenticated, postController.updatePost);
router.delete('/posts/:id', isAuthenticated, postController.deletePost);
router.get('/posts', postController.getAllPosts);        
router.get('/posts/:id', postController.getPostById);    

//  댓글 라우팅
router.post('/comments', isAuthenticated, commentController.createComment);
router.put('/comments/:id', isAuthenticated, commentController.updateComment);
router.delete('/comments/:id', isAuthenticated, commentController.deleteComment);
router.get('/comments', commentController.getAllComments);
router.get('/comments/:id', commentController.getCommentById);

module.exports = router;
