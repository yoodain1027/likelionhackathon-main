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
  const userRole = req.user.role;

  const query =
    userRole === 'admin'
      ? 'UPDATE comments SET content = ? WHERE id = ?'
      : 'UPDATE comments SET content = ? WHERE id = ? AND user_id = ?';

  const params =
    userRole === 'admin'
      ? [content, commentId]
      : [content, commentId, userId];

  db.query(query, params, (err, result) => {
    if (err) return res.status(500).send('DB Error');
    if (result.affectedRows === 0)
      return res.status(403).send('No permission');
    res.send('Comment updated');
  });
};

exports.deleteComment = (req, res) => {
  const commentId = req.params.id;
  const userId = req.user.id;
  const userRole = req.user.role;

  const query =
    userRole === 'admin'
      ? 'DELETE FROM comments WHERE id = ?'
      : 'DELETE FROM comments WHERE id = ? AND user_id = ?';

  const params =
    userRole === 'admin' ? [commentId] : [commentId, userId];

  db.query(query, params, (err, result) => {
    if (err) return res.status(500).send('DB Error');
    if (result.affectedRows === 0)
      return res.status(403).send('No permission');
    res.send('Comment deleted');
  });
};

