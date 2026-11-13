// src/main/resources/static/app/pages/auth/login.page.js

// ✅ 전역 로그인 상태 저장소
import authStore from '../../store/authStore.js';

// ✅ 사이드바 계정 영역 렌더링 함수
import { renderUserPanel } from '../../ui/topbar-user.js';
import { initTopbarSalaryTicker } from '../../ui/salary-ticker.js';
import { authVisualHtml } from './auth-visual.js';
import { mountInstallBanner } from '../../ui/install-banner.js';

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
                <div class="auth-shell">
                    ${authVisualHtml()}

                    <div class="auth-panel">
                        <div class="auth-panel-inner">
                            <!-- 📲 모바일 브라우저 접속 시 홈 화면 설치 안내 (install-banner.js) -->
                            <div id="install-banner-slot"></div>

                            <div class="auth-tabs">
                                <a href="#/login" class="auth-tab is-active">로그인</a>
                                <a href="#/register" class="auth-tab">회원가입</a>
                            </div>

                            <h2 class="auth-welcome">다시 오셨군요 👋</h2>
                            <p class="auth-welcome-sub">계정에 로그인하세요</p>

                            <form id="login-form" class="auth-form">

                                <!-- 아이디 입력 -->
                                <input
                                    type="text"
                                    id="userId"
                                    class="auth-input"
                                    placeholder="아이디를 입력하세요"
                                    required
                                />

                                <!-- 비밀번호 입력 -->
                                <input
                                    type="password"
                                    id="password"
                                    class="auth-input"
                                    placeholder="비밀번호를 입력하세요"
                                    required
                                />

                                <!-- 아이디 기억하기 / 로그인 유지 -->
                                <div class="auth-remember-row">
                                    <label class="auth-remember">
                                        <input type="checkbox" id="rememberId"> 아이디 기억하기
                                    </label>
                                    <label class="auth-remember">
                                        <input type="checkbox" id="keepLoggedIn"> 로그인 유지
                                    </label>
                                </div>

                                <!-- 로그인 버튼 -->
                                <button type="submit" class="auth-submit-btn">
                                    로그인
                                </button>

                            </form>

                            <div class="auth-divider"><span>또는</span></div>

                            <a href="/oauth2/authorization/kakao" class="kakao-login-btn">
                                <span class="auth-kakao-icon">💬</span> 카카오로 로그인
                            </a>

                            <p class="auth-foot-desc">
                                이메일로 가입한 계정이 있다면 이메일 로그인 후<br>
                                설정에서 카카오를 연결해 주세요.
                            </p>

                            <!-- 서비스 소개 -->
                            <p class="auth-foot-link">
                                <a href="#/about">로그인 없이 GROWTIVE 둘러보기 →</a>
                            </p>
                        </div>
                    </div>
                </div>
            `;
        },

        /**
         * 📌 렌더링 후 실행되는 훅
         * - DOM 접근
         * - 이벤트 바인딩
         */
        onMounted() {

            // 📲 모바일이면 홈 화면 설치 안내 카드 표시
            mountInstallBanner(document.getElementById('install-banner-slot'));

            // 소셜 로그인 콜백 처리 중 오류가 났을 때 (OAuth2LoginSuccessHandler 참고)
            const query = location.hash.split('?')[1];
            if (new URLSearchParams(query).get('oauthError')) {
                alert('소셜 로그인 중 문제가 발생했습니다. 잠시 후 다시 시도해주세요.');
                location.hash = '#/login';
            }

            const REMEMBER_KEY = 'growtive-remembered-id';

            const form = document.getElementById('login-form');
            const userIdInput = document.getElementById('userId');
            const passwordInput = document.getElementById('password');
            const rememberInput = document.getElementById('rememberId');
            const keepLoggedInInput = document.getElementById('keepLoggedIn');

            const rememberedId = localStorage.getItem(REMEMBER_KEY);
            if (rememberedId) {
                userIdInput.value = rememberedId;
                rememberInput.checked = true;
                passwordInput.focus();
            }

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
                     * - 응답에 유저 정보가 바로 담겨오므로 /api/auth/me를 또 부를 필요 없음
                     */
                    const { data: loggedInUser } = await axios.post('/api/auth/login', {
                        username: userId,
                        password: password,
                        rememberMe: keepLoggedInInput.checked
                    });

                    if (rememberInput.checked) {
                        localStorage.setItem(REMEMBER_KEY, userId);
                    } else {
                        localStorage.removeItem(REMEMBER_KEY);
                    }

                    /**
                     * 2️⃣ 서버 세션 → 프론트 전역 상태 동기화
                     */
                    authStore.setUser(loggedInUser);

                    /**
                     * 3️⃣ 상단바 사용자 정보 즉시 갱신
                     * - 새로고침 없이 UI 업데이트
                     */
                    renderUserPanel();
                    initTopbarSalaryTicker();

                    /**
                     * 4️⃣ 로그인 후 이동
                     */
                    location.hash = '#/calendar';

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