import { openModal, escapeHtml } from '../../ui/modal.js';
import { renderSharedMenu } from '../../ui/shared-menu.js';

function emptyHint(text) {
    return `<div class="hint">${text}</div>`;
}

export default function FriendsPage() {
    return {
        title: '친구',

        render() {
            return `
            <section class="friend-page">
                <div class="card">
                    <h1 class="title">친구</h1>
                    <p class="subtitle">아이디 또는 이름으로 친구를 검색해서 추가해보세요.</p>
                    <form id="addFriendForm" class="form" style="margin-top:16px; max-width:420px;">
                        <input id="friendUsername" type="text" placeholder="아이디 또는 이름으로 검색" required>
                        <button type="submit" class="btn btn-primary">검색</button>
                    </form>
                    <div id="friendStatus" style="margin-top:8px; font-size:13px; color:var(--text-muted);"></div>
                    <div id="searchResults" style="margin-top:12px;"></div>
                </div>

                <div class="card" style="margin-top:20px;" id="sharedInviteCard" hidden>
                    <h3>공유 캘린더 초대</h3>
                    <p class="hint" style="margin:6px 0 0;">수락하면 사이드바 [가계부] 아래에 공유 캘린더가 생겨요.</p>
                    <div id="sharedInviteList" style="margin-top:12px;"></div>
                </div>

                <div class="card" style="margin-top:20px;">
                    <h3>받은 요청</h3>
                    <div id="incomingList" style="margin-top:12px;"></div>
                </div>

                <div class="card" style="margin-top:20px;">
                    <h3>보낸 요청</h3>
                    <div id="outgoingList" style="margin-top:12px;"></div>
                </div>

                <div class="card" style="margin-top:20px;">
                    <h3>내 친구</h3>
                    <div id="friendsList" style="margin-top:12px;"></div>
                </div>
            </section>`;
        },

        async onMounted() {
            const $ = (id) => document.getElementById(id);

            function renderIncoming(list) {
                if (list.length === 0) {
                    $('incomingList').innerHTML = emptyHint('받은 요청이 없습니다.');
                    return;
                }
                $('incomingList').innerHTML = list.map(c => `
                    <div class="friend-item" data-id="${c.id}">
                        <span><b>${escapeHtml(c.otherDisplayName)}</b> <span class="hint">(${escapeHtml(c.otherUsername)})</span></span>
                        <span class="ledger-tx-actions">
                            <button class="btn btn-xs btn-primary" data-accept="${c.id}">수락</button>
                            <button class="btn btn-xs btn-danger" data-decline="${c.id}">거절</button>
                        </span>
                    </div>
                `).join('');

                $('incomingList').querySelectorAll('button[data-accept]').forEach(btn => {
                    btn.onclick = async () => {
                        try {
                            await axios.post(`/api/friends/requests/${btn.dataset.accept}/accept`);
                            await refresh();
                        } catch (e) {
                            alert(e.response?.data?.message || '수락에 실패했습니다.');
                        }
                    };
                });
                $('incomingList').querySelectorAll('button[data-decline]').forEach(btn => {
                    btn.onclick = async () => {
                        try {
                            await axios.delete(`/api/friends/${btn.dataset.decline}`);
                            await refresh();
                        } catch (e) {
                            alert(e.response?.data?.message || '거절에 실패했습니다.');
                        }
                    };
                });
            }

            function renderOutgoing(list) {
                if (list.length === 0) {
                    $('outgoingList').innerHTML = emptyHint('보낸 요청이 없습니다.');
                    return;
                }
                $('outgoingList').innerHTML = list.map(c => `
                    <div class="friend-item" data-id="${c.id}">
                        <span><b>${escapeHtml(c.otherDisplayName)}</b> <span class="hint">(${escapeHtml(c.otherUsername)})</span> · 응답 대기중</span>
                        <span class="ledger-tx-actions">
                            <button class="btn btn-xs btn-danger" data-cancel="${c.id}">취소</button>
                        </span>
                    </div>
                `).join('');

                $('outgoingList').querySelectorAll('button[data-cancel]').forEach(btn => {
                    btn.onclick = async () => {
                        try {
                            await axios.delete(`/api/friends/${btn.dataset.cancel}`);
                            await refresh();
                        } catch (e) {
                            alert(e.response?.data?.message || '취소에 실패했습니다.');
                        }
                    };
                });
            }

            function renderFriends(list) {
                if (list.length === 0) {
                    $('friendsList').innerHTML = emptyHint('아직 친구가 없습니다.');
                    return;
                }
                $('friendsList').innerHTML = list.map(c => `
                    <div class="friend-item friend-item--stacked" data-id="${c.id}">
                        <div class="friend-item-row">
                            <span><b>${escapeHtml(c.otherDisplayName)}</b> <span class="hint">(${escapeHtml(c.otherUsername)})</span></span>
                            <span class="ledger-tx-actions">
                                <button class="btn btn-xs" data-create-shared="${c.otherUserId}" data-friend-name="${escapeHtml(c.otherDisplayName)}">공유 캘린더 생성</button>
                            </span>
                        </div>
                        <div class="friend-item-row friend-unfriend-row">
                            <button class="btn btn-xs btn-danger friend-unfriend-btn" data-unfriend="${c.id}">친구 해제</button>
                        </div>
                    </div>
                `).join('');

                $('friendsList').querySelectorAll('button[data-create-shared]').forEach(btn => {
                    btn.onclick = () => openCreateSharedModal(Number(btn.dataset.createShared), btn.dataset.friendName);
                });

                $('friendsList').querySelectorAll('button[data-unfriend]').forEach(btn => {
                    btn.onclick = async () => {
                        if (!confirm('이 친구를 해제할까요?')) return;
                        try {
                            await axios.delete(`/api/friends/${btn.dataset.unfriend}`);
                            await refresh();
                        } catch (e) {
                            alert(e.response?.data?.message || '친구 해제에 실패했습니다.');
                        }
                    };
                });

            }

            async function refresh() {
                const [incoming, outgoing, friends, invites] = await Promise.all([
                    axios.get('/api/friends/requests/incoming'),
                    axios.get('/api/friends/requests/outgoing'),
                    axios.get('/api/friends'),
                    axios.get('/api/shared-calendars/invitations').catch(() => ({ data: [] }))
                ]);
                renderIncoming(incoming.data);
                renderOutgoing(outgoing.data);
                renderFriends(friends.data);
                renderSharedInvites(invites.data || []);
            }

            /* ---------------- 공유 캘린더 ---------------- */

            /** 받은 공유 캘린더 초대 (없으면 카드 자체를 숨김) */
            function renderSharedInvites(list) {
                $('sharedInviteCard').hidden = list.length === 0;
                $('sharedInviteList').innerHTML = list.map(inv => `
                    <div class="friend-item">
                        <span><b>${escapeHtml(inv.calendarName)}</b>
                            <span class="hint">· ${escapeHtml(inv.invitedByDisplayName || '알 수 없음')}님이 초대</span></span>
                        <span class="ledger-tx-actions">
                            <button class="btn btn-xs btn-primary" data-accept-shared="${inv.calendarId}">수락</button>
                            <button class="btn btn-xs btn-danger" data-decline-shared="${inv.calendarId}">거절</button>
                        </span>
                    </div>`).join('');

                $('sharedInviteList').querySelectorAll('button[data-accept-shared]').forEach(btn => {
                    btn.onclick = async () => {
                        btn.disabled = true;
                        try {
                            await axios.post(`/api/shared-calendars/${btn.dataset.acceptShared}/accept`);
                            await Promise.all([refresh(), renderSharedMenu()]);
                            if (confirm('공유 캘린더에 참여했어요. 지금 열어볼까요?')) {
                                location.hash = `#/shared?id=${btn.dataset.acceptShared}`;
                            }
                        } catch (e) {
                            btn.disabled = false;
                            alert(e.response?.data?.message || '수락에 실패했습니다.');
                        }
                    };
                });
                $('sharedInviteList').querySelectorAll('button[data-decline-shared]').forEach(btn => {
                    btn.onclick = async () => {
                        if (!confirm('이 공유 캘린더 초대를 거절할까요?')) return;
                        btn.disabled = true;
                        try {
                            await axios.post(`/api/shared-calendars/${btn.dataset.declineShared}/decline`);
                            await Promise.all([refresh(), renderSharedMenu()]);
                        } catch (e) {
                            btn.disabled = false;
                            alert(e.response?.data?.message || '거절에 실패했습니다.');
                        }
                    };
                });
            }

            /** [공유 캘린더 생성] → 이름 입력 모달 */
            function openCreateSharedModal(friendUserId, friendName) {
                const modal = openModal({
                    title: '공유 캘린더 생성',
                    className: 'shared-create-modal',
                    bodyHtml: `
                        <label class="history-search-label" for="sharedName" style="display:block; margin-bottom:6px;">공유 캘린더 이름</label>
                        <input type="text" id="sharedName" class="history-search-input" maxlength="30" placeholder="예: ss couple" style="width:100%;">
                        <p class="history-custom-error" id="sharedNameError" role="alert" hidden></p>
                        <p class="history-modal-help" style="margin-top:10px;"><b>${escapeHtml(friendName)}</b>님과 함께 쓸 가계부·일정을 만들어요.
                            ${escapeHtml(friendName)}님이 초대를 수락하면 함께 볼 수 있어요.</p>
                        <div id="sharedWithList"></div>`,
                    actionsHtml: `
                        <button type="button" class="btn btn-ghost" data-modal-close>닫기</button>
                        <button type="button" class="btn btn-primary" id="createSharedBtn">생성</button>`,
                });
                const root = modal.el;
                const input = root.querySelector('#sharedName');
                const errorEl = root.querySelector('#sharedNameError');
                const btn = root.querySelector('#createSharedBtn');
                input.focus();
                input.addEventListener('input', () => { errorEl.hidden = true; });

                // 이 친구와 이미 함께 쓰는 공유 캘린더 (없으면 아무것도 안 보임)
                axios.get(`/api/shared-calendars/with/${friendUserId}`).then(({ data }) => {
                    const list = data || [];
                    if (list.length === 0 || !root.isConnected) return;
                    root.querySelector('#sharedWithList').innerHTML = `
                        <div class="shared-with-title">${escapeHtml(friendName)}님과 이미 함께 쓰는 캘린더 ${list.length}개</div>
                        <ul class="shared-with-list">
                            ${list.map(c => `
                                <li><a class="shared-with-item" href="#/shared?id=${c.id}">
                                    <span class="shared-with-name">${c.owner ? '👑 ' : ''}${escapeHtml(c.name)}</span>
                                    <span class="hint">${c.otherStatus === 'PENDING' ? '수락 대기' : `${c.memberCount}명`}</span>
                                </a></li>`).join('')}
                        </ul>`;
                }).catch(() => { /* 목록을 못 불러와도 생성은 가능 */ });

                const submit = async () => {
                    const name = input.value.trim();
                    if (!name) {
                        errorEl.textContent = '이름을 입력해주세요.';
                        errorEl.hidden = false;
                        input.focus();
                        return;
                    }
                    btn.disabled = true;
                    try {
                        const { data } = await axios.post('/api/shared-calendars', { name, friendUserId });
                        modal.close();
                        await renderSharedMenu();
                        alert(`'${data.name}' 공유 캘린더를 만들었어요. ${friendName}님에게 초대를 보냈어요.`);
                    } catch (e) {
                        btn.disabled = false;
                        errorEl.textContent = e.response?.data?.message || '생성에 실패했습니다.';
                        errorEl.hidden = false;
                    }
                };
                btn.addEventListener('click', submit);
                input.addEventListener('keydown', (e) => {
                    if (e.key === 'Enter' && !e.isComposing) { e.preventDefault(); submit(); }
                });
            }

            function renderSearchResults(list) {
                if (list.length === 0) {
                    $('searchResults').innerHTML = emptyHint('일치하는 사용자가 없습니다.');
                    return;
                }
                $('searchResults').innerHTML = list.map(u => `
                    <div class="friend-item" data-search-id="${u.id}">
                        <span><b>${escapeHtml(u.displayName)}</b> <span class="hint">(${escapeHtml(u.username)})</span></span>
                        <button class="btn btn-xs btn-primary" data-send="${escapeHtml(u.username)}">친구 요청 보내기</button>
                    </div>
                `).join('');

                $('searchResults').querySelectorAll('button[data-send]').forEach(btn => {
                    btn.onclick = async () => {
                        const username = btn.dataset.send;
                        const statusEl = $('friendStatus');
                        try {
                            statusEl.textContent = '요청 보내는 중...';
                            await axios.post('/api/friends/requests', { username });
                            statusEl.textContent = `"${username}"님에게 친구 요청을 보냈습니다.`;
                            $('searchResults').innerHTML = '';
                            $('friendUsername').value = '';
                            await refresh();
                        } catch (e) {
                            statusEl.textContent = '';
                            alert(e.response?.data?.message || '친구 요청에 실패했습니다.');
                        }
                    };
                });
            }

            $('addFriendForm').addEventListener('submit', async (e) => {
                e.preventDefault();
                const query = $('friendUsername').value.trim();
                if (!query) return;

                const statusEl = $('friendStatus');
                try {
                    statusEl.textContent = '검색 중...';
                    const res = await axios.get('/api/friends/search', { params: { q: query } });
                    statusEl.textContent = '';
                    renderSearchResults(res.data);
                } catch (e) {
                    statusEl.textContent = '';
                    alert(e.response?.data?.message || '검색에 실패했습니다.');
                }
            });

            await refresh();
        }
    };
}
