// src/main/resources/static/app/pages/auth/register.page.js

import { authVisualHtml } from './auth-visual.js';
import { escapeHtml } from '../../ui/modal.js';

export default function RegisterPage() {

    return {

        title: 'Register',

        render() {

            return `
                <div class="auth-shell">
                    ${authVisualHtml()}

                    <div class="auth-panel">
                        <div class="auth-panel-inner">
                            <div class="auth-tabs">
                                <a href="#/login" class="auth-tab">로그인</a>
                                <a href="#/register" class="auth-tab is-active">회원가입</a>
                            </div>

                            <h2 class="auth-welcome">환영해요 🎉</h2>
                            <p class="auth-welcome-sub">새 계정을 만들어보세요</p>

                            <form id="register-form" class="auth-form">

                                <input
                                    type="text"
                                    id="username"
                                    class="auth-input"
                                    placeholder="아이디"
                                    required
                                />

                                <input
                                    type="password"
                                    id="password"
                                    class="auth-input"
                                    placeholder="비밀번호"
                                    required
                                />

                                <input
                                    type="text"
                                    id="displayName"
                                    class="auth-input"
                                    placeholder="이름 (실명 · 나만 보여요)"
                                    required
                                />

                                <!-- 다른 사람(친구·공유 캘린더)에게는 실명 대신 닉네임이 보인다 -->
                                <input
                                    type="text"
                                    id="nickname"
                                    class="auth-input"
                                    placeholder="닉네임 (2~12자 · 다른 사람에게 보여요)"
                                    maxlength="12"
                                    required
                                />
                                <p class="auth-field-msg" id="nicknameMsg" aria-live="polite"></p>

                                <input
                                    type="email"
                                    id="email"
                                    class="auth-input"
                                    placeholder="이메일"
                                    required
                                />

                                <button type="submit" class="auth-submit-btn">
                                    회원가입
                                </button>

                            </form>

                            <p class="auth-desc"> 이미 계정이 있으신가요?
                                <a href="#/login">로그인으로 돌아가기</a>
                            </p>
                        </div>
                    </div>
                </div>
            `;
        },

        onMounted() {

            const form = document.getElementById('register-form');

            // 닉네임: 입력을 멈추면 사용 가능 여부 확인
            const nicknameInput = document.getElementById('nickname');
            const nicknameMsg = document.getElementById('nicknameMsg');
            let nicknameTimer = null;
            nicknameInput.addEventListener('input', () => {
                clearTimeout(nicknameTimer);
                nicknameMsg.textContent = '';
                nicknameMsg.className = 'auth-field-msg';
                const value = nicknameInput.value.trim();
                if (!value) return;
                nicknameTimer = setTimeout(async () => {
                    try {
                        const { data } = await axios.get('/api/auth/nickname/available', { params: { nickname: value } });
                        if (nicknameInput.value.trim() !== value) return;
                        nicknameMsg.textContent = data.message;
                        nicknameMsg.className = `auth-field-msg ${data.available ? 'is-ok' : 'is-error'}`;
                    } catch { /* 확인 실패해도 가입 때 서버가 다시 검사 */ }
                }, 350);
            });

            form.addEventListener('submit', async (e) => {

                e.preventDefault();

                const username = document.getElementById('username').value.trim();
                const password = document.getElementById('password').value.trim();
                const displayName = document.getElementById('displayName').value.trim();
                const nickname = document.getElementById('nickname').value.trim();
                const email = document.getElementById('email').value.trim();

                try {

                    await axios.post('/api/auth/register', {
                        username,
                        password,
                        displayName,
                        nickname,
                        email
                    });

                    alert('회원가입 완료');

                    location.hash = '#/login';

                } catch (err) {

                    alert(err.response?.data?.message || '회원가입 실패');
                    console.error(err);

                }

            });

        }

    };

}