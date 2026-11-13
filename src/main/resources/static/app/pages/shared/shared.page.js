/**
 * 👫 공유 캘린더 (친구와 함께 쓰는 가계부/일정) - #/shared?id=3
 * 1단계: 이름 · 멤버(참여 중 / 초대 대기) 표시
 * 2단계에서 개인 가계부와 같은 캘린더 화면(함께 입력·수정·삭제)이 이 자리에 들어간다.
 */

import { escapeHtml } from '../../ui/modal.js';

export default function SharedCalendarPage() {
    const calendarId = Number(new URLSearchParams(location.hash.split('?')[1] || '').get('id'));

    return {
        title: '공유 캘린더',

        render() {
            return `
            <section class="ledger-page shared-page">
                <div class="card" id="sharedHeaderCard">
                    <div class="hint">불러오는 중…</div>
                </div>
                <div class="card" id="sharedBodyCard" hidden>
                    <h3 class="shared-section-title">함께 쓰는 사람</h3>
                    <ul class="shared-member-list" id="sharedMembers"></ul>
                </div>
                <div class="card" id="sharedNextCard" hidden>
                    <p class="hint" style="margin:0;">🛠️ 공유 가계부·일정 입력 화면은 다음 단계에서 이 자리에 추가돼요.</p>
                </div>
            </section>`;
        },

        async onMounted() {
            const $ = (id) => document.getElementById(id);
            if (!calendarId) {
                $('sharedHeaderCard').innerHTML = `<div class="hint">공유 캘린더를 찾을 수 없어요.</div>`;
                return;
            }

            let detail;
            try {
                ({ data: detail } = await axios.get(`/api/shared-calendars/${calendarId}`));
            } catch (err) {
                const msg = err.response?.data?.message || '공유 캘린더를 불러오지 못했어요.';
                $('sharedHeaderCard').innerHTML = `<div class="hint">${escapeHtml(msg)}</div>`;
                return;
            }

            const { calendar, members } = detail;
            document.title = `GROWTIVE · ${calendar.name}`;
            const joined = members.filter(m => m.status === 'ACCEPTED').length;
            const pending = members.length - joined;

            $('sharedHeaderCard').innerHTML = `
                <div class="shared-header">
                    <div>
                        <div class="shared-kicker">공유 캘린더</div>
                        <h2 class="shared-title">${escapeHtml(calendar.name)}</h2>
                        <div class="hint">만든 사람 ${escapeHtml(calendar.ownerDisplayName || '-')}
                            · 참여 ${joined}명${pending ? ` · 초대 대기 ${pending}명` : ''}</div>
                    </div>
                </div>`;

            $('sharedMembers').innerHTML = members.map(m => `
                <li class="shared-member">
                    <span class="shared-avatar" aria-hidden="true">${escapeHtml((m.displayName || '?').slice(0, 1))}</span>
                    <span class="shared-member-name">
                        <b>${escapeHtml(m.displayName)}</b> <span class="hint">(${escapeHtml(m.username)})</span>
                    </span>
                    <span class="shared-member-tags">
                        ${m.owner ? '<span class="shared-tag shared-tag--owner">만든 사람</span>' : ''}
                        ${m.status === 'ACCEPTED'
                            ? '<span class="shared-tag shared-tag--joined">참여 중</span>'
                            : '<span class="shared-tag shared-tag--pending">초대 대기</span>'}
                    </span>
                </li>`).join('');
            $('sharedBodyCard').hidden = false;
            $('sharedNextCard').hidden = false;
        }
    };
}
