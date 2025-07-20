const db = require('./mysql');

// ✅ 글 작성
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

// ✅ 전체 글 조회
exports.getAllPosts = (req, res) => {
  db.query('SELECT * FROM posts ORDER BY created_at DESC', (err, results) => {
    if (err) return res.status(500).send('DB Error');
    res.send(results);
  });
};

// ✅ 특정 글 조회
exports.getPostById = (req, res) => {
  const postId = req.params.id;

  db.query('SELECT * FROM posts WHERE id = ?', [postId], (err, results) => {
    if (err) return res.status(500).send('DB Error');
    if (results.length === 0) return res.status(404).send('Post not found');
    res.send(results[0]);
  });
};

// ✅ 글 수정
exports.updatePost = (req, res) => {
  const postId = req.params.id;
  const { title, content } = req.body;
  const userId = req.user.id;
  const userRole = req.user.role;

  const query =
    userRole === 'admin'
      ? 'UPDATE posts SET title = ?, content = ? WHERE id = ?'
      : 'UPDATE posts SET title = ?, content = ? WHERE id = ? AND user_id = ?';

  const params =
    userRole === 'admin'
      ? [title, content, postId]
      : [title, content, postId, userId];

  db.query(query, params, (err, result) => {
    if (err) return res.status(500).send('DB Error');
    if (result.affectedRows === 0)
      return res.status(403).send('No permission');
    res.send('Post updated');
  });
};

// ✅ 글 삭제
exports.deletePost = (req, res) => {
  const postId = req.params.id;
  const userId = req.user.id;
  const userRole = req.user.role;

  const query =
    userRole === 'admin'
      ? 'DELETE FROM posts WHERE id = ?'
      : 'DELETE FROM posts WHERE id = ? AND user_id = ?';

  const params =
    userRole === 'admin' ? [postId] : [postId, userId];

  db.query(query, params, (err, result) => {
    if (err) return res.status(500).send('DB Error');
    if (result.affectedRows === 0)
      return res.status(403).send('No permission');
    res.send('Post deleted');
  });
};
