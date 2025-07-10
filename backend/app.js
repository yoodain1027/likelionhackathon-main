require('dotenv').config({ path: __dirname + '/.env' })
console.log('SESSION_SECRET:', process.env.SESSION_SECRET)
const express = require('express')
const cors = require('cors')
const bcrypt = require('bcrypt')
const session = require('express-session')
const pool = require('./mysql')
const transporter = require('./mailer')
const path = require('path')

console.log('현재 __dirname:', __dirname)
console.log('express.static이 바라보는 경로:', path.join(__dirname, '../build'))
console.log(
  'SPA 핸들러가 바라보는 index.html:',
  path.join(__dirname, '../build', 'index.html')
)

const fs = require('fs')
const buildPath = path.join(__dirname, '../build', 'index.html')
fs.access(buildPath, fs.constants.F_OK, (err) => {
  if (err) {
    console.error('index.html 파일이 실제로 존재하지 않습니다:', buildPath)
  } else {
    console.log('index.html 파일이 정상적으로 존재합니다:', buildPath)
  }
})

console.log('현재 process.cwd():', process.cwd())

const app = express()
const port = 3001

// MySQL 연결 테스트 (서버 시작 시)
pool.query('SELECT 1', (err, results) => {
  if (err) console.error('MySQL 연결 실패:', err)
  else console.log('MySQL 연결 성공')
})

// CORS 설정
app.use(
  cors({
    origin: 'https://joongbu.store',
    credentials: true,
  })
)

app.use(express.json())

app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false },
  })
)

// 보호 파일 직접 접근 차단 미들웨어
app.use((req, res, next) => {
  next()
})

// 로그인 여부 확인 미들웨어
const isAuthenticated = (req, res, next) => {
  if (req.session.user) return next()
  if (req.headers.accept && req.headers.accept.includes('application/json')) {
    return res
      .status(401)
      .json({ error: '로그인을 해주십시오.', redirect: '/' })
  }
  return res.send(`
    <script>
      alert('로그인을 해주십시오.');
      window.location.href = '/';
    </script>
  `)
}

function generateCode(length = 6) {
  return Math.random()
    .toString()
    .slice(2, 2 + length)
}

function isCodeValid(sessionKey, req) {
  const now = Date.now()
  const codeTime = req.session[sessionKey + 'Time']
  return codeTime && now - codeTime < 3 * 60 * 1000
}

// 인증메일 전송
app.post('/send-verification', async (req, res) => {
  console.log('send-verification 진입')
  const { email } = req.body
  console.log('인증코드 발송 요청 email:', email)
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

  console.log('EMAIL_USER:', process.env.EMAIL_USER)
  console.log('EMAIL_PASS:', process.env.EMAIL_PASS)

  try {
    console.log('메일 발송 시도')
    const info = await transporter.sendMail(mailOptions)
    console.log('메일 발송 성공:', info)
    res.json({ message: '인증코드가 발송되었습니다.' })
  } catch (err) {
    console.error('메일 발송 에러:', err)
    res.status(500).json({ error: '메일 발송 실패: ' + err.message })
  }
})

// 회원가입: 인증코드 검증
app.post('/verify-code', (req, res) => {
  console.log('verify-code 진입')
  const { email, code } = req.body
  if (
    req.session.emailCode &&
    req.session.emailTarget === email &&
    req.session.emailCode === code &&
    isCodeValid('emailCode', req)
  ) {
    req.session.emailVerified = true
    res.json({ message: '이메일 인증 성공' })
  } else if (!isCodeValid('emailCode', req)) {
    res
      .status(400)
      .json({ error: '인증코드가 만료되었습니다. 재발송 해주세요.' })
  } else {
    res.status(400).json({ error: '인증코드가 일치하지 않습니다.' })
  }
})

// 회원가입 처리
app.post('/signup', async (req, res) => {
  console.log('signup 진입')
  const { iduser, userpw, email, name } = req.body
  if (!iduser || !userpw || !email || !name) {
    console.log('입력값 부족')
    return res
      .status(400)
      .json({ error: 'ID, 비밀번호, 이메일, 이름을 입력하시오.' })
  }
  try {
    const hashedPassword = await bcrypt.hash(userpw, 10)
    console.log('비밀번호 해싱 완료')
    const query =
      'INSERT INTO users (iduser, userpw, email, name) VALUES (?, ?, ?, ?)'
    pool.query(query, [iduser, hashedPassword, email, name], (err, result) => {
      console.log('쿼리 콜백 진입')
      if (err) {
        if (err.code === 'ER_DUP_ENTRY') {
          return res.status(400).json({ error: 'ID가 중복되었습니다.' })
        }
        return res.status(500).json({ error: 'DB 오류: ' + err.message })
      }
      delete req.session.emailVerified
      delete req.session.emailTarget
      delete req.session.emailCode
      delete req.session.emailCodeTime
      res.status(201).json({ message: '회원가입 완료', redirect: '/login' })
    })
  } catch (err) {
    console.log('비밀번호 해싱 또는 쿼리 try/catch 에러', err)
    res.status(500).json({ error: '서버 오류: ' + err.message })
  }
})

// 로그인 처리
app.post('/login', (req, res) => {
  console.log('login 진입')
  const { iduser, userpw } = req.body
  if (!iduser || !userpw) {
    console.log('입력값 부족')
    return res.status(400).json({ error: 'ID와 비밀번호를 입력하시오.' })
  }
  const query = 'SELECT * FROM users WHERE iduser = ?'
  pool.query(query, [iduser], async (err, results) => {
    console.log('쿼리 콜백 진입')
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

// 보호된 라우트
app.get('/main', isAuthenticated, (req, res) => {
  console.log('main 진입')
  res.sendFile(path.join(__dirname, 'main.html'))
})

// 비밀번호 찾기: 인증코드 발송
app.post('/send-reset-code', async (req, res) => {
  console.log('send-reset-code 진입')
  const { iduser, email } = req.body
  if (!iduser || !email)
    return res.status(400).json({ error: 'ID와 이메일을 모두 입력하세요.' })
  pool.query(
    'SELECT * FROM users WHERE iduser = ? AND email = ?',
    [iduser, email],
    async (err, results) => {
      console.log('쿼리 콜백 진입')
      if (err) return res.status(500).json({ error: 'DB 오류: ' + err.message })
      if (results.length === 0)
        return res.status(404).json({ error: '일치하는 계정이 없습니다.' })
      const code = generateCode(6)
      req.session.resetId = iduser
      req.session.resetEmail = email
      req.session.resetCode = code
      req.session.resetCodeTime = Date.now()
      req.session.resetVerified = false
      const mailOptions = {
        from: process.env.EMAIL_USER,
        to: email,
        subject: '비밀번호 재설정 인증코드',
        text: `비밀번호 재설정 인증코드는 ${code} 입니다.`,
      }
      try {
        console.log('메일 발송 시도')
        await transporter.sendMail(mailOptions)
        console.log('메일 발송 성공')
        res.json({ message: '인증코드가 발송되었습니다.' })
      } catch (err) {
        console.error('메일 발송 에러:', err)
        res.status(500).json({ error: '메일 발송 실패: ' + err.message })
      }
    }
  )
})

// 비밀번호 찾기: 인증코드 확인
app.post('/verify-reset-code', (req, res) => {
  console.log('verify-reset-code 진입')
  const { iduser, email, code } = req.body
  if (
    req.session.resetId === iduser &&
    req.session.resetEmail === email &&
    req.session.resetCode === code &&
    isCodeValid('resetCode', req)
  ) {
    req.session.resetVerified = true
    delete req.session.resetCode
    delete req.session.resetCodeTime
    res.json({ message: '인증 성공' })
  } else if (!isCodeValid('resetCode', req)) {
    res
      .status(400)
      .json({ error: '인증코드가 만료되었습니다. 재발송 해주세요.' })
  } else {
    res.status(400).json({ error: '인증코드가 일치하지 않습니다.' })
  }
})

// 비밀번호 찾기: 비밀번호 재설정
app.post('/reset-password', async (req, res) => {
  console.log('reset-password 진입')
  const { iduser, email, newPassword } = req.body
  if (
    !req.session.resetVerified ||
    req.session.resetId !== iduser ||
    req.session.resetEmail !== email
  ) {
    return res.status(400).json({ error: '이메일 인증이 필요합니다.' })
  }
  try {
    const hashed = await bcrypt.hash(newPassword, 10)
    pool.query(
      'UPDATE users SET userpw = ? WHERE iduser = ? AND email = ?',
      [hashed, iduser, email],
      (err, result) => {
        console.log('쿼리 콜백 진입')
        if (err)
          return res.status(500).json({ error: 'DB 오류: ' + err.message })
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
    console.log('비밀번호 해싱 또는 쿼리 try/catch 에러', err)
    res.status(500).json({ error: '서버 오류: ' + err.message })
  }
})

app.use(express.static(path.join(__dirname, '../build')))

// app.use((req, res) => {
//   console.log('SPA 핸들러 진입')
//   res.sendFile(path.join(__dirname, '../build', 'index.html'))
// })

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})
