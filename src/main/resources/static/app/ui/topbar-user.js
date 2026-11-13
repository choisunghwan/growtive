import authStore from '../store/authStore.js';
import { stopTopbarSalaryTicker } from './salary-ticker.js';
import { renderSharedMenu } from './shared-menu.js';

function renderAdminNav() {
    const isAdmin = authStore.user?.role === 'ADMIN';
    const title = document.getElementById('adminMenuTitle');
    const list = document.getElementById('adminMenuList');
    if (title) title.style.display = isAdmin ? '' : 'none';
    if (list) list.style.display = isAdmin ? '' : 'none';
}

async function logout() {
    try {
        await axios.post('/api/auth/logout');

        // 1️⃣ 프론트 상태 초기화
        authStore.clear();
        stopTopbarSalaryTicker();

        // 2️⃣ ⭐ 사이드바 계정 영역 즉시 다시 그리기
        renderUserPanel();

        // 3️⃣ 로그인 페이지 이동
        location.hash = '#/login';
    } catch (e) {
        alert('로그아웃 실패');
    }
}

/**
 * 사이드바 하단 계정 영역(이름/다크모드/로그아웃) 갱신.
 * 로그인 상태에서만 사이드바 자체가 보이므로(라우터 가드), 로그인 안 된 상태는 다루지 않는다.
 */
export function renderUserPanel() {
    renderAdminNav();
    renderSharedMenu();   // 가계부 아래 공유 캘린더 메뉴 + 친구 메뉴 초대 배지

    const logoutBtn = document.getElementById('sidebarLogoutBtn');
    if (logoutBtn) {
        logoutBtn.onclick = logout;
    }

    const nameEl = document.getElementById('sidebarUserName');
    if (nameEl && authStore.user) {
        nameEl.textContent = `${authStore.user.displayName}님`;
    }
}
