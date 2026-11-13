// resources/static/app/ui/shared-menu.js
// 사이드바 [가계부] 아래에 내가 참여 중인 공유 캘린더 메뉴를 붙이고,
// [소셜 > 친구] 옆에 받은 공유 캘린더 초대 개수 배지를 표시한다.

import authStore from '../store/authStore.js';
import { escapeHtml } from './modal.js';

const ICON_SHARED = `<svg class="sidebar-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/><circle cx="9.5" cy="15.5" r="1.6"/><circle cx="14.5" cy="15.5" r="1.6"/></svg>`;

let seq = 0;

/** 공유 캘린더 메뉴/초대 배지 다시 그리기 (로그인 상태가 아니면 모두 지움) */
export async function renderSharedMenu() {
    const list = document.getElementById('ledgerMenuList');
    const badge = document.getElementById('friendsBadge');
    const mySeq = ++seq;

    const clear = () => {
        list?.querySelectorAll('li[data-shared-menu]').forEach(li => li.remove());
        if (badge) badge.hidden = true;
    };

    if (!authStore.isLoggedIn()) {
        clear();
        return;
    }

    let calendars = [];
    let invitations = [];
    try {
        const [c, i] = await Promise.all([
            axios.get('/api/shared-calendars'),
            axios.get('/api/shared-calendars/invitations'),
        ]);
        calendars = c.data || [];
        invitations = i.data || [];
    } catch (err) {
        console.warn('공유 캘린더 메뉴를 불러오지 못했습니다.', err);
        return;
    }
    if (mySeq !== seq) return; // 더 최근 호출이 있음

    clear();
    if (list) {
        const hash = location.hash;
        list.insertAdjacentHTML('beforeend', calendars.map(c => {
            const href = `#/shared?id=${c.id}`;
            return `
            <li data-shared-menu>
                <a href="${href}" class="${hash === href ? 'active' : ''}" title="공유 캘린더 · ${c.memberCount}명">
                    ${ICON_SHARED}
                    <span class="sidebar-label">${escapeHtml(c.name)}</span>
                </a>
            </li>`;
        }).join(''));
    }
    if (badge) {
        badge.textContent = String(invitations.length);
        badge.hidden = invitations.length === 0;
        badge.title = `받은 공유 캘린더 초대 ${invitations.length}개`;
    }
}
