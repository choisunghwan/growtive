// src/main/resources/static/app/pages/auth/login.page.js

// ✅ 전역 로그인 상태 저장소
import authStore from '../../store/authStore.js';

// ✅ 상단바 유저 표시 렌더링 함수
import { renderTopbarUser } from '../../ui/topbar-user.js';

export default function LoginPage() {
    return {
        title: 'Login',

        /**
         * 📌 화면 렌더링 역할
         * - HTML 문자열 반환
         * - JSP/Thymeleaf 대신 SPA 방식
         */
        render() {
            return `
                <div class="login-container">
                    <h1 class="login-title">GROWTIVE</h1>

                    <form id="login-form" class="login-form">

                        <!-- 아이디 입력 -->
                        <input
                            type="text"
                            id="userId"
                            class="login-input"
                            placeholder="아이디를 입력하세요"
                            required
                        />

                        <!-- 비밀번호 입력 -->
                        <input
                            type="password"
                            id="password"
                            class="login-input"
                            placeholder="비밀번호를 입력하세요"
                            required
                        />

                        <!-- 로그인 버튼 -->
                        <button type="submit" class="login-btn">
                            로그인
                        </button>

                    </form>

                    <p class="login-desc">
                        계정 아이디와 비밀번호를 입력하세요
                    </p>
                </div>
            `;
        },

        /**
         * 📌 렌더링 후 실행되는 훅
         * - DOM 접근
         * - 이벤트 바인딩
         */
        onMounted() {

            const form = document.getElementById('login-form');
            const userIdInput = document.getElementById('userId');
            const passwordInput = document.getElementById('password');

            form.addEventListener('submit', async (e) => {

                e.preventDefault();

                const userId = userIdInput.value.trim();
                const password = passwordInput.value.trim();

                // 입력값 검증
                if (!userId || !password) {
                    alert('아이디와 비밀번호를 입력하세요');
                    return;
                }

                try {

                    /**
                     * 1️⃣ 서버 로그인 요청
                     * - AuthController → AuthService → DB 조회
                     * - 로그인 성공 시 HttpSession 생성
                     */
                    await axios.post('/api/auth/login', {
                        userId: userId,
                        password: password
                    });

                    /**
                     * 2️⃣ 서버 세션 → 프론트 전역 상태 동기화
                     * - 현재 로그인 유저 정보 조회
                     */
                    await authStore.load();

                    /**
                     * 3️⃣ 상단바 사용자 정보 즉시 갱신
                     * - 새로고침 없이 UI 업데이트
                     */
                    renderTopbarUser();

                    /**
                     * 4️⃣ 로그인 후 이동
                     */
                    location.hash = '#/dashboard';

                } catch (err) {

                    /**
                     * 로그인 실패 처리
                     */
                    alert('아이디 또는 비밀번호가 올바르지 않습니다.');
                    console.error(err);

                }

            });
        }
    };
}