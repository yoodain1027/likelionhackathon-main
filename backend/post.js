const express = require('express');
const router = express.Router();
const postController = require('../controller/postController');
const { authenticateUser } = require('../middleware/auth');

router.post('/', authenticateUser, postController.createPost);
router.put('/:id', authenticateUser, postController.updatePost);
router.delete('/:id', authenticateUser, postController.deletePost);

module.exports = router;

const db = require('../config/db');

exports.createPost = (req, res) => {
  const { title, content } = req.body;
  const userId = req.user.id;

  db.query(
    'INSERT INTO posts (user_id, title, content) VALUES (?, ?, ?)',
    [userId, title, content],
    (err, result) => {
      if (err) return res.status(500).send('DB Error');
      res.status(201).send({ postId: result.insertId });
    }
  );
};

exports.updatePost = (req, res) => {
  const postId = req.params.id;
  const { title, content } = req.body;
  const userId = req.user.id;

  db.query(
    'UPDATE posts SET title = ?, content = ? WHERE id = ? AND user_id = ?',
    [title, content, postId, userId],
    (err, result) => {
      if (err) return res.status(500).send('DB Error');
      if (result.affectedRows === 0) return res.status(403).send('No permission');
      res.send('Post updated');
    }
  );
};

exports.deletePost = (req, res) => {
  const postId = req.params.id;
  const userId = req.user.id;

  db.query(
    'DELETE FROM posts WHERE id = ? AND user_id = ?',
    [postId, userId],
    (err, result) => {
      if (err) return res.status(500).send('DB Error');
      if (result.affectedRows === 0) return res.status(403).send('No permission');
      res.send('Post deleted');
    }
  );
};

