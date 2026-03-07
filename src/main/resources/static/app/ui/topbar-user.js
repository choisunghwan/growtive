import authStore from '../store/authStore.js';

export function renderTopbarUser() {
    const el = document.getElementById('topbar-user');
    if (!el) return;

    // ❌ 로그인 안 된 상태
    if (!authStore.user) {
        el.innerHTML = `<a href="#/login">로그인</a>`;
        return;
    }

    // ✅ 로그인 된 상태
    el.innerHTML = `
        <span class="topbar-username">
            👤 ${authStore.user.displayName}님
        </span>
        <button id="logout-btn" class="topbar-logout">
            로그아웃
        </button>
    `;

    // ✅ 로그아웃 클릭 이벤트
    const logoutBtn = document.getElementById('logout-btn');
    logoutBtn.addEventListener('click', async () => {
        try {
            await axios.post('/api/auth/logout');

            // 1️⃣ 프론트 상태 초기화
            authStore.clear();

            // 2️⃣ ⭐ 상단바 즉시 다시 그리기
            renderTopbarUser();

            // 3️⃣ 로그인 페이지 이동
            location.hash = '#/login';
        } catch (e) {
            alert('로그아웃 실패');
        }
    });
}
