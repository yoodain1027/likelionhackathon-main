document.addEventListener('DOMContentLoaded', function () {
  // [비밀번호 찾기] 인증코드 확인 버튼 클릭 시: 아이디, 이메일, 인증코드 입력값을 서버로 보내 인증
  // 인증 성공하면 새 비밀번호 입력란을 보여주고, 타이머를 멈춤
  const btnVerify = document.getElementById('findpw-verify-code')
  const btnReset = document.getElementById('findpw-reset-btn')
  const boxNewPw = document.getElementById('findpw-newpw-box')

  if (btnVerify) {
    btnVerify.addEventListener('click', async () => {
      const id = document.getElementById('findpw-id').value
      const email = document.getElementById('findpw-email').value
      const code = document.getElementById('findpw-code').value
      if (!id || !email || !code)
        return alert('아이디, 이메일, 인증코드를 모두 입력하세요.')
      const res = await fetch('/verify-reset-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ iduser: id, email, code }),
      })
      const data = await res.json()
      alert(data.message || data.error)
      if (res.ok && data.message && data.message.includes('성공')) {
        // 인증 성공 시 새 비밀번호 입력란 표시
        if (boxNewPw) boxNewPw.style.display = 'block'
        // 인증 타이머 숨기기
        const timer = document.getElementById('findpw-email-timer')
        if (timer) timer.style.display = 'none'
        if (typeof findpwEmailTimer !== 'undefined' && findpwEmailTimer) {
          clearInterval(findpwEmailTimer)
        }
      }
    })
  }

  // [비밀번호 찾기] 새 비밀번호 변경 버튼 클릭 시: 아이디, 이메일, 새 비밀번호를 서버로 보내 비밀번호 변경 요청
  // 성공하면 입력폼을 리셋하고 새 비밀번호 입력란을 숨김
  if (btnReset) {
    btnReset.addEventListener('click', async () => {
      const id = document.getElementById('findpw-id').value
      const email = document.getElementById('findpw-email').value
      const newpw = document.getElementById('findpw-newpw').value
      if (!id || !email || !newpw)
        return alert('아이디, 이메일, 새 비밀번호를 모두 입력하세요.')
      const res = await fetch('/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ iduser: id, email, newPassword: newpw }),
      })
      const data = await res.json()
      alert(data.message || data.error)
      if (res.ok && data.message && data.message.includes('변경')) {
        // 성공 시 폼 리셋 및 새 비밀번호 입력란 숨김
        document.getElementById('findpw-form').reset()
        if (boxNewPw) boxNewPw.style.display = 'none'
      }
    })
  }

  // [로그인] 및 [회원가입] 관련 동작은 React 컴포넌트로 분리되어 관리됩니다.
  // 이 main.js에서는 더 이상 로그인/회원가입 관련 기능을 구현하지 않습니다.

  // [로그아웃] 로그아웃 버튼 클릭 시: 서버에 로그아웃 요청, 성공하면 안내 후 메인으로 이동
  async function Logout() {
    if (confirm('로그아웃 하시겠습니까?')) {
      // 사용자 확인
      try {
        // 서버에 GET /logout 요청 보내기
        const response = await fetch('/logout')
        const result = await response.json() // 서버 응답을 JSON으로 파싱
        alert(result.message) // 로그아웃 메시지 표시
        if (result.redirect) {
          // 리디렉션 경로가 있으면
          window.location.href = result.redirect // 지정된 페이지로 이동
        }
      } catch (err) {
        alert('서버와의 연결에 실패했습니다.') // 네트워크 에러 시 alert 표시
      }
    }
  }

  // [회원탈퇴] 회원탈퇴 버튼 클릭 시: 서버에 회원탈퇴 요청, 성공하면 안내 후 회원가입 페이지로 이동
  async function Delete() {
    if (confirm('정말 회원탈퇴를 진행하시겠습니까?')) {
      // 사용자 확인
      try {
        // 서버에 DELETE /user 요청 보내기
        const response = await fetch('/user', { method: 'DELETE' })
        const result = await response.json() // 서버 응답을 JSON으로 파싱
        alert(result.message) // 회원탈퇴 메시지 표시
        if (result.redirect) {
          // 리디렉션 경로가 있으면
          window.location.href = result.redirect // 지정된 페이지로 이동
        }
      } catch (err) {
        alert('서버와의 연결에 실패했습니다.') // 네트워크 에러 시 alert 표시
      }
    }
  }

  // [로그인] 로그인 페이지로 이동 버튼 함수는 React 라우팅으로 대체되어 더 이상 사용하지 않습니다.

  // [비밀번호 찾기] 인증코드 타이머(3분): 인증코드 발송/재발송 시 타이머 시작, 만료 시 안내
  let findpwEmailTimer = null
  let findpwEmailTimeLeft = 180

  function startFindpwEmailTimer() {
    clearInterval(findpwEmailTimer)
    findpwEmailTimeLeft = 180
    const timerElem = document.getElementById('findpw-email-timer')
    timerElem.textContent = `남은 시간: ${findpwEmailTimeLeft}초`
    findpwEmailTimer = setInterval(() => {
      findpwEmailTimeLeft--
      timerElem.textContent = `남은 시간: ${findpwEmailTimeLeft}초`
      if (findpwEmailTimeLeft <= 0) {
        clearInterval(findpwEmailTimer)
        timerElem.textContent = '인증코드가 만료되었습니다.'
      }
    }, 1000)
  }

  // [비밀번호 찾기] 인증코드 발송/재발송 버튼: 아이디, 이메일 입력 후 서버에 인증코드 요청, 타이머 시작
  const btnSend = document.getElementById('findpw-send-code')
  const btnResend = document.getElementById('findpw-resend-code')
  if (btnSend && btnResend) {
    const newSend = btnSend.cloneNode(true)
    newSend.id = 'findpw-send-code'
    btnSend.parentNode.replaceChild(newSend, btnSend)
    const newResend = btnResend.cloneNode(true)
    newResend.id = 'findpw-resend-code'
    btnResend.parentNode.replaceChild(newResend, btnResend)

    newSend.addEventListener('click', async (e) => {
      e.preventDefault()
      const id = document.getElementById('findpw-id').value
      const email = document.getElementById('findpw-email').value
      if (!id) return alert('아이디를 입력하세요.')
      if (!email) return alert('이메일을 입력하세요.')
      const res = await fetch('/send-reset-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ iduser: id, email }),
      })
      const data = await res.json()
      alert(data.message || data.error)
      newSend.disabled = true
      newSend.style.display = 'none'
      newResend.style.display = 'inline-block'
      newResend.disabled = false
      startFindpwEmailTimer()
    })

    newResend.addEventListener('click', async (e) => {
      e.preventDefault()
      const id = document.getElementById('findpw-id').value
      const email = document.getElementById('findpw-email').value
      if (!id) return alert('아이디를 입력하세요.')
      if (!email) return alert('이메일을 입력하세요.')
      const res = await fetch('/send-reset-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ iduser: id, email }),
      })
      const data = await res.json()
      alert(data.message || data.error)
      startFindpwEmailTimer()
    })
  }

  // [회원가입] 이메일 인증 타이머(3분): 인증코드 발송/재발송 시 타이머 시작, 만료 시 안내
  let emailTimer = null
  let emailTimeLeft = 180 // 3분

  function startEmailTimer() {
    clearInterval(emailTimer)
    emailTimeLeft = 180
    const timerElem = document.getElementById('email-timer')
    timerElem.textContent = `남은 시간: ${emailTimeLeft}초`
    emailTimer = setInterval(() => {
      emailTimeLeft--
      timerElem.textContent = `남은 시간: ${emailTimeLeft}초`
      if (emailTimeLeft <= 0) {
        clearInterval(emailTimer)
        timerElem.textContent = '인증코드가 만료되었습니다.'
      }
    }, 1000)
  }

  const sendCodeBtn = document.getElementById('send-code-btn')
  const resendCodeBtn = document.getElementById('resend-code-btn')

  if (sendCodeBtn && resendCodeBtn) {
    // [회원가입] 인증코드 발송/재발송 버튼: 이메일 입력 후 서버에 인증코드 요청, 타이머 시작
    // 기존 이벤트 리스너 제거를 위해 버튼을 복제 후 교체 (중복 방지)
    const newSendBtn = sendCodeBtn.cloneNode(true)
    sendCodeBtn.parentNode.replaceChild(newSendBtn, sendCodeBtn)
    const newResendBtn = resendCodeBtn.cloneNode(true)
    resendCodeBtn.parentNode.replaceChild(newResendBtn, resendCodeBtn)

    newSendBtn.addEventListener('click', async () => {
      const email = document.getElementById('email').value
      if (!email) return alert('이메일을 입력하세요.')
      const res = await fetch('/send-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      const data = await res.json()
      alert(data.message || data.error)
      // 버튼 상태 변경
      newSendBtn.disabled = true
      newSendBtn.style.display = 'none'
      newResendBtn.style.display = 'inline-block'
      newResendBtn.disabled = false
      startEmailTimer()
    })

    newResendBtn.addEventListener('click', async () => {
      const email = document.getElementById('email').value
      if (!email) return alert('이메일을 입력하세요.')
      const res = await fetch('/send-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      const data = await res.json()
      alert(data.message || data.error)
      // 재발송 시 타이머 리셋, 기존 코드 만료(백엔드에서 처리)
      startEmailTimer()
    })
  }
})
