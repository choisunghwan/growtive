/**
 * 👫 공유 캘린더 (친구와 함께 쓰는 가계부/일정) - #/shared?id=3
 * - 위: 캘린더 이름 · 함께 쓰는 사람
 * - 아래: 개인 가계부와 똑같은 캘린더 화면(LedgerPage)을 공유 모드로 재사용
 *   → 참여 중인 멤버 누구나 조회·입력·수정·삭제, 각 내역에 작성자 표시
 * 공유 가계부 금액은 개인 통계(상단 급여 게이지, 돈 흐름, 내역)에 포함되지 않는다.
 */

import { escapeHtml } from '../../ui/modal.js';
import LedgerPage from '../ledger/ledger.page.js';

export default function SharedCalendarPage() {
    const calendarId = Number(new URLSearchParams(location.hash.split('?')[1] || '').get('id')) || null;
    const ledger = calendarId ? LedgerPage({ sharedCalendarId: calendarId }) : null;

    return {
        title: '공유 캘린더',

        render() {
            return `
            <div class="shared-page">
                <div class="card shared-header-card" id="sharedHeaderCard">
                    <div class="hint">불러오는 중…</div>
                </div>
                <div id="sharedLedger" hidden>${ledger ? ledger.render() : ''}</div>
            </div>`;
        },

        async onMounted() {
            const $ = (id) => document.getElementById(id);
            const fail = (msg) => {
                $('sharedHeaderCard').innerHTML = `<div class="hint">${escapeHtml(msg)}</div>`;
                $('sharedLedger').remove(); // 참여자가 아니면 가계부 화면 자체를 띄우지 않음
            };
            if (!calendarId) return fail('공유 캘린더를 찾을 수 없어요.');

            let detail;
            try {
                ({ data: detail } = await axios.get(`/api/shared-calendars/${calendarId}`));
            } catch (err) {
                return fail(err.response?.data?.message || '공유 캘린더를 불러오지 못했어요.');
            }

            const { calendar, members } = detail;
            document.title = `GROWTIVE · ${calendar.name}`;
            const joined = members.filter(m => m.status === 'ACCEPTED');
            const pending = members.filter(m => m.status !== 'ACCEPTED');

            $('sharedHeaderCard').innerHTML = `
                <div class="shared-header">
                    <div class="shared-header-main">
                        <div class="shared-kicker">공유 캘린더</div>
                        <h2 class="shared-title">${escapeHtml(calendar.name)}</h2>
                    </div>
                    <ul class="shared-member-chips" aria-label="함께 쓰는 사람">
                        ${joined.map(m => `
                            <li class="shared-member-chip" title="${escapeHtml(m.displayName)} (${escapeHtml(m.username)})${m.owner ? ' · 만든 사람' : ''}">
                                <span class="shared-avatar" aria-hidden="true">${escapeHtml((m.displayName || '?').slice(0, 1))}</span>
                                <span>${escapeHtml(m.displayName)}</span>
                            </li>`).join('')}
                        ${pending.length ? `<li class="shared-member-chip shared-member-chip--pending" title="${escapeHtml(pending.map(m => m.displayName).join(', '))}">초대 대기 ${pending.length}명</li>` : ''}
                    </ul>
                </div>`;

            $('sharedLedger').hidden = false;
            await ledger.onMounted();
        }
    };
}
