import { escapeHtml } from '../../ui/modal.js';
import authStore from '../../store/authStore.js';

function fmtDateTime(v) {
    if (!v) return '-';
    return v.replace('T', ' ').slice(0, 16);
}

export default function AdminMembersPage() {
    let members = [];
    let editingId = null;

    return {
        title: '회원관리',

        render() {
            return `
            <section class="admin-page">
                <div class="card">
                    <h1 class="title">회원관리</h1>
                    <p class="subtitle">가입한 사용자 목록입니다.</p>
                    <div id="adminStatus" style="margin-top:10px; font-size:13px; color:var(--text-muted);"></div>
                    <div style="overflow-x:auto; margin-top:16px;">
                        <table class="table" id="memberTable">
                            <thead>
                                <tr>
                                    <th>ID</th>
                                    <th>아이디</th>
                                    <th>이름</th>
                                    <th>닉네임</th>
                                    <th>이메일</th>
                                    <th>권한</th>
                                    <th>최근 접속</th>
                                    <th>가입일</th>
                                    <th>관리</th>
                                </tr>
                            </thead>
                            <tbody id="memberTableBody"></tbody>
                        </table>
                    </div>
                </div>
            </section>`;
        },

        async onMounted() {
            const statusEl = document.getElementById('adminStatus');
            const tbody = document.getElementById('memberTableBody');
            const myUserId = authStore.getUserId();

            function renderRow(u) {
                const isSelf = String(u.id) === String(myUserId);

                if (editingId === u.id) {
                    return `
                        <tr data-id="${u.id}">
                            <td data-label="ID">${u.id}</td>
                            <td data-label="아이디">${escapeHtml(u.username)}</td>
                            <td data-label="이름"><input type="text" class="edit-display-name" value="${escapeHtml(u.displayName)}"></td>
                            <td data-label="닉네임">${escapeHtml(u.nickname || '-')}</td>
                            <td data-label="이메일"><input type="text" class="edit-email" value="${escapeHtml(u.email)}"></td>
                            <td data-label="권한">${u.role === 'ADMIN' ? '<span class="admin-role-badge">ADMIN</span>' : '<span class="user-role-badge">USER</span>'}</td>
                            <td data-label="최근 접속">${fmtDateTime(u.lastLoginAt)}</td>
                            <td data-label="가입일">${fmtDateTime(u.createdAt)}</td>
                            <td data-label="관리">
                                <button class="btn btn-xs btn-primary" data-save="${u.id}">저장</button>
                                <button class="btn btn-xs btn-ghost" data-cancel="${u.id}">취소</button>
                            </td>
                        </tr>`;
                }

                return `
                    <tr data-id="${u.id}">
                        <td data-label="ID">${u.id}</td>
                        <td data-label="아이디">${escapeHtml(u.username)}</td>
                        <td data-label="이름">${escapeHtml(u.displayName)}</td>
                        <td data-label="닉네임">${escapeHtml(u.nickname || '-')}</td>
                        <td data-label="이메일">${escapeHtml(u.email)}</td>
                        <td data-label="권한">${u.role === 'ADMIN' ? '<span class="admin-role-badge">ADMIN</span>' : '<span class="user-role-badge">USER</span>'}</td>
                        <td data-label="최근 접속">${fmtDateTime(u.lastLoginAt)}</td>
                        <td data-label="가입일">${fmtDateTime(u.createdAt)}</td>
                        <td data-label="관리">
                            <button class="btn btn-xs" data-edit="${u.id}">수정</button>
                            <button class="btn btn-xs btn-danger" data-del="${u.id}"${isSelf ? ' disabled title="자기 자신은 탈퇴 처리할 수 없습니다"' : ''}>탈퇴</button>
                        </td>
                    </tr>`;
            }

            function renderTable() {
                if (members.length === 0) {
                    tbody.innerHTML = `<tr><td colspan="9">등록된 회원이 없습니다.</td></tr>`;
                    return;
                }
                tbody.innerHTML = members.map(renderRow).join('');
                bindRowActions();
            }

            function bindRowActions() {
                tbody.querySelectorAll('button[data-edit]').forEach(btn => {
                    btn.onclick = () => {
                        editingId = Number(btn.dataset.edit);
                        renderTable();
                    };
                });

                tbody.querySelectorAll('button[data-cancel]').forEach(btn => {
                    btn.onclick = () => {
                        editingId = null;
                        renderTable();
                    };
                });

                tbody.querySelectorAll('button[data-save]').forEach(btn => {
                    btn.onclick = async () => {
                        const id = Number(btn.dataset.save);
                        const row = tbody.querySelector(`tr[data-id="${id}"]`);
                        const displayName = row.querySelector('.edit-display-name').value.trim();
                        const email = row.querySelector('.edit-email').value.trim();

                        try {
                            const { data } = await axios.put(`/api/admin/users/${id}`, { displayName, email });
                            const idx = members.findIndex(m => m.id === id);
                            if (idx !== -1) members[idx] = data;
                            editingId = null;
                            renderTable();
                            statusEl.textContent = `수정 완료 (총 ${members.length}명)`;
                        } catch (e) {
                            alert(e.response?.data?.message || '수정에 실패했습니다.');
                        }
                    };
                });

                tbody.querySelectorAll('button[data-del]').forEach(btn => {
                    btn.onclick = async () => {
                        const id = Number(btn.dataset.del);
                        const target = members.find(m => m.id === id);
                        if (!confirm(`"${target?.username}" 계정을 탈퇴 처리할까요? 되돌릴 수 없습니다.`)) return;

                        try {
                            await axios.delete(`/api/admin/users/${id}`);
                            members = members.filter(m => m.id !== id);
                            renderTable();
                            statusEl.textContent = `총 ${members.length}명`;
                        } catch (e) {
                            alert(e.response?.data?.message || '탈퇴 처리에 실패했습니다.');
                        }
                    };
                });
            }

            try {
                const { data } = await axios.get('/api/admin/users');
                members = Array.isArray(data) ? data : [];
                statusEl.textContent = `총 ${members.length}명`;
                renderTable();
            } catch (e) {
                const container = document.querySelector('.admin-page');
                if (e.response && e.response.status === 403) {
                    container.innerHTML = `
                        <div class="card">
                            <h2>접근 권한이 없습니다</h2>
                            <p class="hint">관리자만 볼 수 있는 화면입니다.</p>
                        </div>`;
                } else {
                    statusEl.textContent = '회원 목록을 불러오지 못했습니다.';
                }
            }
        }
    };
}
