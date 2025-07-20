// 로그인 여부 확인
function isAuthenticated(req, res, next) {
  if (req.session && req.session.user) {
    req.user = req.session.user // 세션에서 사용자 정보 꺼내기
    return next()
  }
  return res.status(401).json({ message: '로그인이 필요합니다.' })
}

// 관리자 권한 확인
function isAdmin(req, res, next) {
  if (req.session && req.session.user && req.session.user.role === 'admin') {
    req.user = req.session.user
    return next()
  }
  return res.status(403).json({ message: '관리자만 접근 가능합니다.' })
}

module.exports = {
  isAuthenticated,
  isAdmin,
}
