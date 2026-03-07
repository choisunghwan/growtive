import { api } from '../../core/apiClient.js';

export default function UsersListPage() {
    return {
        title: '회원 목록',
        render() {
            return `
      <div class="card">
        <h2>회원 목록</h2>
        <div id="count" class="muted"></div>
        <table class="table">
          <thead><tr><th>ID</th><th>Email</th><th>Name</th><th>Created</th></tr></thead>
          <tbody id="usersBody"></tbody>
        </table>
        <div style="margin-top:8px;">
          <a class="btn" href="#/users/new">+ 새 회원</a>
        </div>
      </div>`;
        },
        async onMounted() {
            try {
                const { data } = await api.get('/api/users');
                document.getElementById('count').textContent = `총 ${data.length}명`;
                document.getElementById('usersBody').innerHTML = data.map(u => `
          <tr>
            <td>${u.id ?? ''}</td>
            <td>${u.email ?? ''}</td>
            <td>${u.displayName ?? ''}</td>
            <td>${u.createdAt ?? ''}</td>
          </tr>
        `).join('');
            } catch (e) {
                console.error(e);
            }
        }
    };
}
