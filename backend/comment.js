const express = require('express');
const router = express.Router();
const commentController = require('../controller/commentController');
const { authenticateUser } = require('../middleware/auth');

router.post('/', authenticateUser, commentController.createComment);
router.put('/:id', authenticateUser, commentController.updateComment);
router.delete('/:id', authenticateUser, commentController.deleteComment);

module.exports = router;

const db = require('../config/db');

exports.createComment = (req, res) => {
  const { postId, content } = req.body;
  const userId = req.user.id;

  db.query(
    'INSERT INTO comments (post_id, user_id, content) VALUES (?, ?, ?)',
    [postId, userId, content],
    (err, result) => {
      if (err) return res.status(500).send('DB Error');
      res.status(201).send({ commentId: result.insertId });
    }
  );
};

exports.updateComment = (req, res) => {
  const commentId = req.params.id;
  const { content } = req.body;
  const userId = req.user.id;

  db.query(
    'UPDATE comments SET content = ? WHERE id = ? AND user_id = ?',
    [content, commentId, userId],
    (err, result) => {
      if (err) return res.status(500).send('DB Error');
      if (result.affectedRows === 0) return res.status(403).send('No permission');
      res.send('Comment updated');
    }
  );
};

exports.deleteComment = (req, res) => {
  const commentId = req.params.id;
  const userId = req.user.id;

  db.query(
    'DELETE FROM comments WHERE id = ? AND user_id = ?',
    [commentId, userId],
    (err, result) => {
      if (err) return res.status(500).send('DB Error');
      if (result.affectedRows === 0) return res.status(403).send('No permission');
      res.send('Comment deleted');
    }
  );
};
