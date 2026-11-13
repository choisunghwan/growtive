/**
 * 👫 공유 캘린더 (친구와 함께 쓰는 가계부/일정) - #/shared?id=3
 * - 위: 캘린더 이름 · 함께 쓰는 사람(👑 관리자 표시) · [멤버 관리]
 * - 아래: 개인 가계부와 똑같은 캘린더 화면(LedgerPage)을 공유 모드로 재사용
 *   → 참여 중인 멤버 누구나 조회·입력·수정·삭제, 각 내역에 작성자 표시
 * 공유 가계부 금액은 개인 통계(상단 급여 게이지, 자산 흐름, 내역)에 포함되지 않는다.
 *
 * [멤버 관리] (참여자 모두 볼 수 있음)
 * - 누구나: 멤버 보기, 친구 추가 초대, 내가 보낸 초대 취소, 나가기
 * - 👑 관리자만: 이름 변경, 관리자 넘기기, 다른 사람이 보낸 초대 취소, 캘린더 삭제
 * - 관리자가 나가면 남은 참여자 중 한 명에게 관리자를 넘김 (기본: 가장 먼저 참여한 사람)
 * - 참여자가 0명이 되면 캘린더 자동 삭제
 */

import { escapeHtml, openModal } from '../../ui/modal.js';
import { renderSharedMenu } from '../../ui/shared-menu.js';
import authStore from '../../store/authStore.js';
import LedgerPage from '../ledger/ledger.page.js';

const CROWN = '<span class="shared-crown" title="관리자" aria-label="관리자">👑</span>';

export default function SharedCalendarPage() {
    const calendarId = Number(new URLSearchParams(location.hash.split('?')[1] || '').get('id')) || null;
    const ledger = calendarId ? LedgerPage({ sharedCalendarId: calendarId }) : null;
    let detail = null;               // { calendar, members }

    const meId = () => authStore.getUserId?.();
    const api = (path = '') => `/api/shared-calendars/${calendarId}${path}`;
    const errMsg = (err, fallback) => err?.response?.data?.message || fallback;

    async function loadDetail() {
        ({ data: detail } = await axios.get(api()));
        return detail;
    }

    function isAdmin() { return !!detail?.calendar?.owner; }

    /** 남은 참여자 (나 제외), 참여한 순서 */
    function otherJoinedMembers() {
        return detail.members
            .filter(m => m.status === 'ACCEPTED' && m.userId !== meId())
            .sort((a, b) => String(a.joinedAt || '').localeCompare(String(b.joinedAt || '')));
    }

    function renderHeader() {
        const { calendar, members } = detail;
        document.title = `GROWTIVE · ${calendar.name}`;
        const joined = members.filter(m => m.status === 'ACCEPTED');
        const pending = members.filter(m => m.status !== 'ACCEPTED');
        document.getElementById('sharedHeaderCard').innerHTML = `
            <div class="shared-header">
                <div class="shared-header-main">
                    <div class="shared-kicker">공유 캘린더</div>
                    <h2 class="shared-title">${escapeHtml(calendar.name)}</h2>
                </div>
                <div class="shared-header-side">
                    <ul class="shared-member-chips" aria-label="함께 쓰는 사람">
                        ${joined.map(m => `
                            <li class="shared-member-chip" title="${escapeHtml(m.displayName)} (${escapeHtml(m.username)})${m.owner ? ' · 관리자' : ''}">
                                <span class="shared-avatar" aria-hidden="true">${escapeHtml((m.displayName || '?').slice(0, 1))}</span>
                                <span>${m.owner ? CROWN : ''}${escapeHtml(m.displayName)}</span>
                            </li>`).join('')}
                        ${pending.length ? `<li class="shared-member-chip shared-member-chip--pending" title="${escapeHtml(pending.map(m => m.displayName).join(', '))}">초대 대기 ${pending.length}명</li>` : ''}
                    </ul>
                    <button type="button" class="btn btn-sm shared-manage-btn" id="openMembersBtn">
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" y1="8" x2="19" y2="14"/><line x1="22" y1="11" x2="16" y2="11"/></svg>
                        멤버 관리
                    </button>
                </div>
            </div>`;
        document.getElementById('openMembersBtn').onclick = openMembersModal;
    }

    /** 변경 후: 상세 다시 불러와 헤더/사이드바/열린 모달 갱신 */
    async function afterChange(modal) {
        await loadDetail();
        renderHeader();
        renderSharedMenu();
        if (modal) renderMembersBody(modal);
    }

    /* ======================= 멤버 관리 모달 ======================= */

    function openMembersModal() {
        const modal = openModal({
            title: '멤버 관리',
            className: 'shared-members-modal',
            bodyHtml: '',
            actionsHtml: `
                <button type="button" class="btn btn-danger-ghost shared-leave-btn" id="leaveBtn">나가기</button>
                <button type="button" class="btn btn-ghost" data-modal-close>닫기</button>`,
        });
        modal.el.querySelector('#leaveBtn').onclick = () => leave(modal);
        renderMembersBody(modal);
    }

    function renderMembersBody(modal) {
        const body = modal.el.querySelector('.history-modal-body');
        const me = meId();
        const admin = isAdmin();
        const { calendar, members } = detail;

        body.innerHTML = `
            <ul class="shared-member-list">
                ${members.map(m => {
                    const pending = m.status !== 'ACCEPTED';
                    const canCancel = pending && (admin || m.invitedBy === me);
                    const canTransfer = admin && !pending && m.userId !== me;
                    return `
                    <li class="shared-member">
                        <span class="shared-avatar" aria-hidden="true">${escapeHtml((m.displayName || '?').slice(0, 1))}</span>
                        <span class="shared-member-name">
                            ${m.owner ? CROWN : ''}<b>${escapeHtml(m.displayName)}</b>
                            ${m.userId === me ? '<span class="shared-me">나</span>' : ''}
                            <span class="hint">${escapeHtml(m.username)}${pending ? ' · 초대 대기' : ''}</span>
                        </span>
                        <span class="shared-member-actions">
                            ${canTransfer ? `<button type="button" class="btn btn-xs" data-transfer="${m.userId}">관리자 넘기기</button>` : ''}
                            ${canCancel ? `<button type="button" class="btn btn-xs" data-cancel-invite="${m.userId}">초대 취소</button>` : ''}
                        </span>
                    </li>`;
                }).join('')}
            </ul>
            <button type="button" class="btn btn-sm shared-invite-btn" id="inviteMoreBtn">+ 친구 초대</button>
            ${admin ? `
            <div class="shared-admin-box">
                <div class="shared-admin-title">${CROWN} 관리자 메뉴</div>
                <label class="history-search-label" for="renameInput">캘린더 이름</label>
                <div class="shared-rename-row">
                    <input type="text" id="renameInput" class="history-search-input" maxlength="30" value="${escapeHtml(calendar.name)}">
                    <button type="button" class="btn btn-sm btn-primary" id="renameBtn">변경</button>
                </div>
                <p class="history-custom-error" id="renameError" role="alert" hidden></p>
                <button type="button" class="btn btn-sm btn-danger shared-delete-btn" id="deleteCalBtn">캘린더 삭제</button>
            </div>` : `
            <p class="history-modal-help shared-admin-note">이름 변경·관리자 넘기기·삭제는 ${CROWN} 관리자만 할 수 있어요.</p>`}`;

        body.querySelector('#inviteMoreBtn').onclick = () => openInviteModal(modal);
        body.querySelectorAll('[data-transfer]').forEach(btn => {
            btn.onclick = () => transfer(modal, Number(btn.dataset.transfer));
        });
        body.querySelectorAll('[data-cancel-invite]').forEach(btn => {
            btn.onclick = () => cancelInvite(modal, Number(btn.dataset.cancelInvite));
        });
        if (admin) {
            const input = body.querySelector('#renameInput');
            const doRename = () => rename(modal, input.value);
            body.querySelector('#renameBtn').onclick = doRename;
            input.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' && !e.isComposing) { e.preventDefault(); doRename(); }
            });
            input.addEventListener('input', () => { body.querySelector('#renameError').hidden = true; });
            body.querySelector('#deleteCalBtn').onclick = () => deleteCalendar(modal);
        }
    }

    /* ----- 친구 초대 ----- */

    async function openInviteModal(parent) {
        const modal = openModal({
            title: '친구 초대',
            className: 'history-modal--sub',
            bodyHtml: `<div class="hint">불러오는 중…</div>`,
        });
        let friends;
        try {
            ({ data: friends } = await axios.get(api('/invitable-friends')));
        } catch (err) {
            modal.el.querySelector('.history-modal-body').innerHTML = `<div class="hint">${escapeHtml(errMsg(err, '친구 목록을 불러오지 못했어요.'))}</div>`;
            return;
        }
        if (!modal.el.isConnected) return;
        const body = modal.el.querySelector('.history-modal-body');
        body.innerHTML = friends.length === 0
            ? `<div class="hint">초대할 수 있는 친구가 없어요. 내 친구가 모두 참여 중이거나 초대 대기 중이에요.</div>`
            : `<p class="history-modal-help">초대를 받은 친구가 수락하면 함께 쓸 수 있어요.</p>
               <ul class="history-category-list">
                   ${friends.map(f => `
                       <li class="history-category-item">
                           <span><b>${escapeHtml(f.displayName)}</b> <span class="hint">${escapeHtml(f.username)}</span></span>
                           <button type="button" class="btn btn-xs btn-primary" data-invite="${f.userId}">초대</button>
                       </li>`).join('')}
               </ul>`;
        body.querySelectorAll('[data-invite]').forEach(btn => {
            btn.onclick = async () => {
                btn.disabled = true;
                try {
                    await axios.post(api('/invitations'), { friendUserId: Number(btn.dataset.invite) });
                    btn.textContent = '초대함';
                    await afterChange(parent);
                } catch (err) {
                    btn.disabled = false;
                    alert(errMsg(err, '초대하지 못했어요.'));
                }
            };
        });
    }

    async function cancelInvite(modal, userId) {
        const m = detail.members.find(x => x.userId === userId);
        if (!confirm(`${m?.displayName || ''}님에게 보낸 초대를 취소할까요?`)) return;
        try {
            await axios.delete(api(`/invitations/${userId}`));
            await afterChange(modal);
        } catch (err) {
            alert(errMsg(err, '초대를 취소하지 못했어요.'));
        }
    }

    /* ----- 👑 관리자 메뉴 ----- */

    async function rename(modal, value) {
        const errorEl = modal.el.querySelector('#renameError');
        const name = value.trim();
        if (!name) {
            errorEl.textContent = '이름을 입력해주세요.';
            errorEl.hidden = false;
            return;
        }
        if (name === detail.calendar.name) return;
        try {
            await axios.put(api(), { name });
            await afterChange(modal);
        } catch (err) {
            errorEl.textContent = errMsg(err, '이름을 바꾸지 못했어요.');
            errorEl.hidden = false;
        }
    }

    async function transfer(modal, userId) {
        const m = detail.members.find(x => x.userId === userId);
        if (!confirm(`${m?.displayName || ''}님에게 👑 관리자를 넘길까요?\n넘기면 이름 변경·삭제는 ${m?.displayName || ''}님만 할 수 있어요. (나는 계속 참여해요)`)) return;
        try {
            await axios.post(api('/transfer'), { newOwnerId: userId });
            await afterChange(modal);
        } catch (err) {
            alert(errMsg(err, '관리자를 넘기지 못했어요.'));
        }
    }

    async function deleteCalendar(modal) {
        const name = detail.calendar.name;
        if (!confirm(`'${name}' 공유 캘린더를 삭제할까요?\n모든 멤버의 화면에서 사라지고, 함께 쓴 가계부·일정도 모두 삭제돼요. 되돌릴 수 없어요.`)) return;
        try {
            await axios.delete(api());
            modal.close();
            await renderSharedMenu();
            alert(`'${name}' 공유 캘린더를 삭제했어요.`);
            location.hash = '#/calendar';
        } catch (err) {
            alert(errMsg(err, '삭제하지 못했어요.'));
        }
    }

    /* ----- 나가기 ----- */

    async function leave(modal) {
        const name = detail.calendar.name;
        const others = otherJoinedMembers();

        if (isAdmin() && others.length > 0) {
            // 관리자가 나가면 남은 참여자 중 한 명에게 넘김 (기본: 가장 먼저 참여한 사람)
            openSuccessorModal(modal, others);
            return;
        }
        const message = others.length === 0
            ? `나가면 참여자가 없어져서 '${name}' 캘린더와 함께 쓴 가계부·일정이 모두 삭제돼요.\n나갈까요?`
            : `'${name}'에서 나갈까요?\n다시 참여하려면 초대를 받아야 해요.`;
        if (!confirm(message)) return;
        await doLeave(modal, null);
    }

    function openSuccessorModal(parent, others) {
        const modal = openModal({
            title: '관리자 넘기고 나가기',
            className: 'history-modal--sub',
            bodyHtml: `
                <p class="history-modal-help">나가기 전에 ${CROWN} 관리자를 넘길 사람을 골라주세요.</p>
                <ul class="history-category-list" role="radiogroup" aria-label="새 관리자">
                    ${others.map((m, i) => `
                        <li>
                            <label class="history-category-item">
                                <span><b>${escapeHtml(m.displayName)}</b> <span class="hint">${escapeHtml(m.username)}${i === 0 ? ' · 가장 먼저 참여' : ''}</span></span>
                                <input type="radio" name="successor" value="${m.userId}"${i === 0 ? ' checked' : ''}>
                            </label>
                        </li>`).join('')}
                </ul>`,
            actionsHtml: `
                <button type="button" class="btn btn-ghost" data-modal-close>취소</button>
                <button type="button" class="btn btn-danger" id="transferLeaveBtn">넘기고 나가기</button>`,
        });
        modal.el.querySelector('#transferLeaveBtn').onclick = async () => {
            const picked = modal.el.querySelector('input[name="successor"]:checked');
            if (!picked) return;
            modal.close();
            await doLeave(parent, Number(picked.value));
        };
    }

    async function doLeave(modal, newOwnerId) {
        const name = detail.calendar.name;
        try {
            const { data } = await axios.post(api('/leave'), newOwnerId ? { newOwnerId } : {});
            modal.close();
            await renderSharedMenu();
            alert(data?.deleted ? `'${name}' 캘린더에서 나갔어요. 참여자가 없어서 캘린더가 삭제됐어요.` : `'${name}' 캘린더에서 나갔어요.`);
            location.hash = '#/calendar';
        } catch (err) {
            alert(errMsg(err, '나가지 못했어요.'));
        }
    }

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

            try {
                await loadDetail();
            } catch (err) {
                return fail(errMsg(err, '공유 캘린더를 불러오지 못했어요.'));
            }
            renderHeader();
            $('sharedLedger').hidden = false;
            await ledger.onMounted();
        }
    };
}
