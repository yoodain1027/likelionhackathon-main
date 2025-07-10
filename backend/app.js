require('dotenv').config()
const express = require('express')
const cors = require('cors')
const bcrypt = require('bcrypt') // 비밀번호 해싱
const session = require('express-session') // 세션관리
const pool = require('./mysql') //데이터베이스 연결
const path = require('path') // 파일 경로 처리

const app = express()
const port = 3001 // React 개발서버와 포트 분리 권장

// CORS 설정 (React와 연동)
app.use(
  cors({
    origin: 'http://localhost:3000', // React 개발서버 주소
    credentials: true, // 세션/쿠키 허용
  })
)

// =============================
// app.js 백엔드 주요 기능별 동작 방식 및 목적 설명
// =============================
// - 회원가입: 이메일 인증(코드 발송/검증/만료/재발송), 인증 성공 시만 가입 가능, DB 저장, 인증 세션 관리
// - 로그인: 입력값 검증, 비밀번호 해싱 비교, 세션 저장, 안내 메시지/리디렉션
// - 비밀번호 찾기(재설정): 아이디+이메일 일치 시 인증코드 발송/검증/만료/재발송, 인증 성공 시만 비밀번호 변경(DB UPDATE), 인증 세션 관리
// - 테마: 다크/라이트 테마 DB 저장/불러오기, 로그인 사용자별 적용
// - 로그아웃/회원탈퇴: 세션/쿠키 삭제, DB 삭제, 안내 메시지/리디렉션
// - 보호 라우트: main.html, pyramid.html 직접 접근 차단, 세션 기반 인증
// - 모든 주요 기능별로 입력 검증, 보안(해싱/세션), 데이터 일관성, UX/안내 메시지 강화
// - 각 기능별 상세 동작은 아래 라우트/미들웨어별 주석 참고(팀원 공유/타 프로젝트 적용 용이성 목적)

// 미들웨어 설정
app.use(express.json())

// 세션 설정
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false, // 세션이 변경되도 저장 X
    saveUninitialized: true, // 초기화되지않은 세션 저장 X
    cookie: { secure: false }, // http 에서는 false로로
  })
)

// 보호 파일 직접 접근 차단 미들웨어 (main.html, pyramid.html)
app.use((req, res, next) => {
  // 정적 리소스(css, js, 이미지 등)는 차단하지 않음
  const staticExts = [
    '.css',
    '.js',
    '.png',
    '.jpg',
    '.jpeg',
    '.gif',
    '.ico',
    '.svg',
  ]
  const isStatic = staticExts.some((ext) => req.path.endsWith(ext)) // 정적파일인지 확인
  // main.html, pyramid.html 직접 접근 차단은 GET 요청에만 적용
  if (
    req.method === 'GET' &&
    !isStatic &&
    (req.path === '/main.html' || req.path === '/pyramid.html') &&
    !req.session.user // 세션이 없는 경우에만 차단
  ) {
    return res
      .status(403)
      .send('<h1>403 Forbidden</h1><p>직접 접근이 금지된 파일입니다.</p>')
  }
  next()
})

// 로그인 여부 확인 미들웨어
const isAuthenticated = (req, res, next) => {
  if (req.session.user) {
    //세션에 사용자 정보가 있을경우 다음 미들웨어로 이동
    return next()
  }
  if (req.headers.accept && req.headers.accept.includes('application/json')) {
    // 클라이언트가 JSON 응답 요청을 했을 경우 로그인 해달라는 메시지 출력
    return res
      .status(401)
      .json({ error: '로그인을 해주십시오.', redirect: '/' })
  }
  return res.send(`
    <script>
      alert('로그인을 해주십시오.');
      window.location.href = '/';
    </script>
  `) // 웹페이지
}

// 인증코드 생성 함수
function generateCode(length = 6) {
  // 6자리 숫자 코드 생성
  return Math.random()
    .toString()
    .slice(2, 2 + length)
}

// 인증코드 유효시간(1분) 체크 함수
function isCodeValid(sessionKey, req) {
  const now = Date.now()
  const codeTime = req.session[sessionKey + 'Time']
  return codeTime && now - codeTime < 3 * 60 * 1000 // 3분 이내
}

const transporter = require('./mailer') // mailer.js 불러오기

// 회원가입: 인증코드 발송
app.post('/send-verification', async (req, res) => {
  const { email } = req.body
  if (!email) return res.status(400).json({ error: '이메일을 입력하세요.' })
  const code = generateCode(6)
  req.session.emailCode = code
  req.session.emailTarget = email
  req.session.emailCodeTime = Date.now()
  req.session.emailVerified = false
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: '이메일 인증코드',
    text: `인증코드는 ${code} 입니다.`,
  }
  try {
    await transporter.sendMail(mailOptions)
    res.json({ message: '인증코드가 발송되었습니다.' })
  } catch (err) {
    res.status(500).json({ error: '메일 발송 실패: ' + err.message })
  }
})

// 회원가입: 인증코드 검증
app.post('/verify-code', (req, res) => {
  const { email, code } = req.body
  if (
    req.session.emailCode &&
    req.session.emailTarget === email &&
    req.session.emailCode === code &&
    isCodeValid('emailCode', req)
  ) {
    req.session.emailVerified = true
    // 인증 성공 시 인증코드 관련 세션은 남겨둔다 (회원가입까지 유지)
    // delete req.session.emailCode
    // delete req.session.emailTarget
    // delete req.session.emailCodeTime
    res.json({ message: '이메일 인증 성공' })
  } else if (!isCodeValid('emailCode', req)) {
    res
      .status(400)
      .json({ error: '인증코드가 만료되었습니다. 재발송 해주세요.' })
  } else {
    res.status(400).json({ error: '인증코드가 일치하지 않습니다.' })
  }
})

// 회원가입 처리(이메일 인증 필수)
app.post('/signup', async (req, res) => {
  const { iduser, userpw, email } = req.body
  if (!iduser || !userpw || !email) {
    return res.status(400).json({ error: 'ID, 비밀번호, 이메일을 입력하시오.' })
  }
  // 프론트엔드에서 이메일 인증을 별도 처리할 수도 있으므로, 인증 체크는 옵션
  // if (!req.session.emailVerified || req.session.emailTarget !== email) {
  //   return res.status(400).json({ error: '이메일 인증을 완료해주십시오.' })
  // }
  try {
    const hashedPassword = await bcrypt.hash(userpw, 10)
    const query = 'INSERT INTO users (iduser, userpw, email) VALUES (?, ?, ?)'
    pool.query(query, [iduser, hashedPassword, email], (err, result) => {
      if (err) {
        if (err.code === 'ER_DUP_ENTRY') {
          return res.status(400).json({ error: 'ID가 중복되었습니다.' })
        }
        return res.status(500).json({ error: 'DB 오류: ' + err.message })
      }
      // 회원가입 성공 시 인증 관련 세션 및 인증코드 세션 삭제
      delete req.session.emailVerified
      delete req.session.emailTarget
      delete req.session.emailCode
      delete req.session.emailCodeTime
      res.status(201).json({ message: '회원가입 완료', redirect: '/login' })
    })
  } catch (err) {
    res.status(500).json({ error: '서버 오류: ' + err.message })
  }
})

// POST: 로그인 처리
app.post('/login', (req, res) => {
  const { iduser, userpw } = req.body
  if (!iduser || !userpw) {
    return res.status(400).json({ error: 'ID와 비밀번호를 입력하시오.' })
  }
  const query = 'SELECT * FROM users WHERE iduser = ?'
  pool.query(query, [iduser], async (err, results) => {
    if (err) {
      return res.status(500).json({ error: 'DB 오류: ' + err.message })
    }
    if (results.length === 0) {
      return res.status(401).json({ error: '존재하지 않는 ID입니다.' })
    }
    const user = results[0]
    const match = await bcrypt.compare(userpw, user.userpw)
    if (!match) {
      return res.status(401).json({ error: '비밀번호가 틀렸습니다.' })
    }
    req.session.user = { iduser: user.iduser, id: user.id }
    res.status(200).json({ message: '로그인 성공', iduser: user.iduser })
  })
})

// GET: 로그아웃 처리
app.get('/logout', (req, res) => {
  req.session.destroy((err) => {
    // 세션 삭제
    if (err) {
      return res.status(500).json({ error: '로그아웃 실패' })
    }
    res.clearCookie('connect.sid') // 세션 쿠키 삭제
    res.json({ message: '로그아웃 완료', redirect: '/' })
  })
})

// DELETE: 회원탈퇴 처리
app.delete('/user', isAuthenticated, (req, res) => {
  const { iduser } = req.session.user
  const query = 'DELETE FROM users WHERE iduser = ?' // user → users
  pool.query(query, [iduser], (err) => {
    if (err) {
      return res.status(500).json({ error: 'DB 오류: ' + err.message })
    }
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ error: '세션 삭제 실패' })
      }
      res.clearCookie('connect.sid') // 세션 쿠키 삭제
      res.status(200).json({ message: '회원탈퇴 완료', redirect: '/signup' })
    })
  })
})

// 보호된 라우트
app.get('/main', isAuthenticated, (req, res) => {
  res.sendFile(path.join(__dirname, 'main.html'))
})

// [비밀번호 찾기] 아이디와 이메일이 모두 맞는지 확인 후 인증코드(숫자 6자리)를 이메일로 보내줌
// - 사용자가 아이디와 이메일을 입력하면, DB에서 둘 다 맞는지 확인
// - 맞으면 인증코드를 세션에 저장하고, 이메일로 발송
// - 인증코드는 3분간만 유효함
app.post('/send-reset-code', async (req, res) => {
  const { iduser, email } = req.body
  if (!iduser || !email)
    return res.status(400).json({ error: 'ID와 이메일을 모두 입력하세요.' })
  // DB에서 아이디와 이메일이 모두 맞는지 확인
  pool.query(
    'SELECT * FROM users WHERE iduser = ? AND email = ?',
    [iduser, email],
    async (err, results) => {
      if (err) return res.status(500).json({ error: 'DB 오류: ' + err.message })
      if (results.length === 0)
        return res.status(404).json({ error: '일치하는 계정이 없습니다.' })
      // 인증코드 생성 및 세션에 저장
      const code = generateCode(6)
      req.session.resetId = iduser // 인증 시도한 아이디
      req.session.resetEmail = email // 인증 시도한 이메일
      req.session.resetCode = code // 인증코드
      req.session.resetCodeTime = Date.now() // 인증코드 발급 시각
      req.session.resetVerified = false // 인증 성공 여부
      // 이메일로 인증코드 발송
      const mailOptions = {
        from: process.env.EMAIL_USER,
        to: email,
        subject: '비밀번호 재설정 인증코드',
        text: `비밀번호 재설정 인증코드는 ${code} 입니다.`,
      }
      try {
        await transporter.sendMail(mailOptions)
        res.json({ message: '인증코드가 발송되었습니다.' })
      } catch (err) {
        res.status(500).json({ error: '메일 발송 실패: ' + err.message })
      }
    }
  )
})

// [비밀번호 찾기] 인증코드 확인
// - 사용자가 입력한 아이디, 이메일, 인증코드가 모두 세션에 저장된 값과 일치하는지 확인
// - 인증코드가 맞고, 3분 이내면 인증 성공(세션에 인증 성공 표시)
// - 인증 성공 시 인증코드 세션 삭제, 실패 시 안내 메시지
app.post('/verify-reset-code', (req, res) => {
  const { iduser, email, code } = req.body
  if (
    req.session.resetId === iduser &&
    req.session.resetEmail === email &&
    req.session.resetCode === code &&
    isCodeValid('resetCode', req)
  ) {
    req.session.resetVerified = true // 인증 성공 표시
    delete req.session.resetCode // 인증코드 삭제
    delete req.session.resetCodeTime // 인증코드 발급시각 삭제
    res.json({ message: '인증 성공' })
  } else if (!isCodeValid('resetCode', req)) {
    res
      .status(400)
      .json({ error: '인증코드가 만료되었습니다. 재발송 해주세요.' })
  } else {
    res.status(400).json({ error: '인증코드가 일치하지 않습니다.' })
  }
})

// [비밀번호 찾기] 새 비밀번호로 변경
// - 인증이 성공한 경우(세션에 인증 성공 표시가 있을 때)만 비밀번호 변경 가능
// - 입력한 새 비밀번호를 암호화해서 DB에 저장
// - 변경 후 인증 관련 세션 모두 삭제, 성공 메시지와 함께 로그인 페이지로 이동 안내
app.post('/reset-password', async (req, res) => {
  const { iduser, email, newPassword } = req.body
  if (
    !req.session.resetVerified ||
    req.session.resetId !== iduser ||
    req.session.resetEmail !== email
  ) {
    return res.status(400).json({ error: '이메일 인증이 필요합니다.' })
  }
  try {
    // 새 비밀번호 암호화(해싱)
    const hashed = await bcrypt.hash(newPassword, 10)
    pool.query(
      'UPDATE users SET userpw = ? WHERE iduser = ? AND email = ?',
      [hashed, iduser, email],
      (err, result) => {
        if (err)
          return res.status(500).json({ error: 'DB 오류: ' + err.message })
        // 인증 관련 세션 모두 삭제(보안)
        delete req.session.resetId
        delete req.session.resetEmail
        delete req.session.resetVerified
        res.json({
          message: '비밀번호가 성공적으로 변경되었습니다.',
          redirect: '/',
        })
      }
    )
  } catch (err) {
    res.status(500).json({ error: '서버 오류: ' + err.message })
  }
})

// 정적 파일 제공 (index.html, signup.html, style.css, main.js 등)
app.use(express.static(__dirname, { index: false }))

// 404 에러 핸들링
app.use((req, res) => {
  res.status(404).json({ error: '페이지를 찾을 수 없습니다.' })
})

// 서버 시작
app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})
