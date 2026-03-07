import { api } from '../../core/apiClient.js';

export default function UsersNewPage() {
    return {
        title: '회원 등록',
        render() {
            return `
      <div class="card">
        <h2>회원 등록</h2>
        <form id="signupForm">
          <label>이메일</label>
          <input id="email" type="email" placeholder="user@growtive.ai" required>
          <label>이름</label>
          <input id="displayName" type="text" placeholder="홍길동" required>
          <label>비밀번호</label>
          <input id="password" type="password" placeholder="8자 이상" minlength="8" required>
          <div style="margin-top:12px;">
            <button class="primary" type="submit">등록</button>
            <a class="muted btn" href="#/users">목록으로</a>
          </div>
          <div id="msg" style="margin-top:8px;"></div>
        </form>
      </div>`;
        },
        onMounted() {
            const $ = id => document.getElementById(id);
            $('signupForm').addEventListener('submit', async (e) => {
                e.preventDefault();
                const payload = {
                    email: $('email').value.trim(),
                    displayName: $('displayName').value.trim(),
                    password: $('password').value
                };
                try {
                    await api.post('/api/users/signup', payload);
                    $('msg').innerHTML = `<div class="ok">등록 완료!</div>`;
                    e.target.reset();
                    window.location.hash = '#/users';
                } catch (err) {
                    const data = err.response?.data;
                    const pretty =
                        (data && (data.message || data.detail)) ? (data.message || data.detail) :
                            (typeof data === 'string') ? data :
                                (data ? JSON.stringify(data) : err.message);
                    $('msg').innerHTML = `<div class="error">등록 실패: ${pretty}</div>`;
                }
            });
        }
    };
}
