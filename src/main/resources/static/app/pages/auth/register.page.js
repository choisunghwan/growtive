// src/main/resources/static/app/pages/auth/register.page.js

export default function RegisterPage() {

    return {

        title: 'Register',

        render() {

            return `
                <div class="login-container">

                    <h1 class="login-title">회원가입</h1>

                    <form id="register-form" class="login-form">

                        <input
                            type="text"
                            id="username"
                            class="login-input"
                            placeholder="아이디"
                            required
                        />

                        <input
                            type="password"
                            id="password"
                            class="login-input"
                            placeholder="비밀번호"
                            required
                        />

                        <input
                            type="text"
                            id="displayName"
                            class="login-input"
                            placeholder="이름"
                            required
                        />

                        <input
                            type="email"
                            id="email"
                            class="login-input"
                            placeholder="이메일"
                            required
                        />

                        <button type="submit" class="login-btn">
                            회원가입
                        </button>

                    </form>

                </div>
            `;
        },

        onMounted() {

            const form = document.getElementById('register-form');

            form.addEventListener('submit', async (e) => {

                e.preventDefault();

                const username = document.getElementById('username').value.trim();
                const password = document.getElementById('password').value.trim();
                const displayName = document.getElementById('displayName').value.trim();
                const email = document.getElementById('email').value.trim();

                try {

                    await axios.post('/api/auth/register', {
                        username,
                        password,
                        displayName,
                        email
                    });

                    alert('회원가입 완료');

                    location.hash = '#/login';

                } catch (err) {

                    alert('회원가입 실패');
                    console.error(err);

                }

            });

        }

    };

}