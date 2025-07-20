const db = require('./mysql')

// ✅ 댓글 작성
exports.createComment = (req, res) => {
  const { postId, content } = req.body
  const userId = req.user.id

  db.query(
    'INSERT INTO comments (post_id, user_id, content) VALUES (?, ?, ?)',
    [postId, userId, content],
    (err, result) => {
      if (err) return res.status(500).send('DB Error')
      res.status(201).send({ commentId: result.insertId })
    }
  )
}

// ✅ 댓글 수정
exports.updateComment = (req, res) => {
  const commentId = req.params.id
  const { content } = req.body
  const userId = req.user.id
  const userRole = req.user.role

  const query =
    userRole === 'admin'
      ? 'UPDATE comments SET content = ? WHERE id = ?'
      : 'UPDATE comments SET content = ? WHERE id = ? AND user_id = ?'

  const params =
    userRole === 'admin' ? [content, commentId] : [content, commentId, userId]

  db.query(query, params, (err, result) => {
    if (err) return res.status(500).send('DB Error')
    if (result.affectedRows === 0) return res.status(403).send('No permission')
    res.send('Comment updated')
  })
}

// ✅ 댓글 삭제
exports.deleteComment = (req, res) => {
  const commentId = req.params.id
  const userId = req.user.id
  const userRole = req.user.role

  const query =
    userRole === 'admin'
      ? 'DELETE FROM comments WHERE id = ?'
      : 'DELETE FROM comments WHERE id = ? AND user_id = ?'

  const params = userRole === 'admin' ? [commentId] : [commentId, userId]

  db.query(query, params, (err, result) => {
    if (err) return res.status(500).send('DB Error')
    if (result.affectedRows === 0) return res.status(403).send('No permission')
    res.send('Comment deleted')
  })
}

// ✅ 전체 댓글 조회
exports.getAllComments = (req, res) => {
  db.query(
    'SELECT * FROM comments ORDER BY created_at DESC',
    (err, results) => {
      if (err) return res.status(500).send('DB Error')
      res.send(results)
    }
  )
}

// ✅ 특정 댓글 조회
exports.getCommentById = (req, res) => {
  const commentId = req.params.id

  db.query(
    'SELECT * FROM comments WHERE id = ?',
    [commentId],
    (err, results) => {
      if (err) return res.status(500).send('DB Error')
      if (results.length === 0) return res.status(404).send('Comment not found')
      res.send(results[0])
    }
  )
}
