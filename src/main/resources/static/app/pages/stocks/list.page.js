import { confirmModal } from '../../ui/modal.js';

export default function StockListPage() {
    return {
        title: '내 종목 목록',
        render: () => `
      <div class="card">
        <h2>📊 내 종목 목록</h2>
        <div style="display:flex; gap:8px; align-items:center; margin:8px 0 12px;">
          <input id="q" placeholder="검색 (심볼/이름)" style="flex:1; padding:6px 10px"/>
          <button id="searchBtn" class="btn">검색</button>
        </div>

        <table class="tbl tbl--stocks">
          <colgroup>
            <col style="width:80px"><!-- ID -->
            <col style="width:140px"><!-- 심볼 -->
            <col style="width:110px"><!-- 시장 -->
            <col style="width:auto"><!-- 이름 -->
            <col style="width:160px"><!-- 액션 -->
          </colgroup>
          <thead>
            <tr><th>ID</th><th>심볼</th><th>시장</th><th>이름</th><th>액션</th></tr>
          </thead>
          <tbody id="stocksBody"></tbody>
        </table>
      </div>
    `,
        async onMounted() {
            const load = async () => {
                const q = document.getElementById('q').value.trim();
                const { data } = await axios.get('/api/stocks', { params: { q } });
                const body = document.getElementById('stocksBody');
                body.innerHTML = data.map(s => `
          <tr>
            <td>${s.id}</td>
            <td>${s.symbol}</td>
            <td>${s.market}</td>
            <td title="${s.name}">${s.name}</td>
            <td class="action">
              <button class="btn btn-sm" onclick="location.hash='#/stocks/detail?id=${s.id}'">보기</button>
              <button class="btn btn-sm btn-danger" data-del="${s.id}">삭제</button>
            </td>
          </tr>
        `).join('');
                // 삭제 클릭
                body.querySelectorAll('button[data-del]').forEach(btn => {
                    btn.onclick = async () => {
                        const id = btn.dataset.del;
                        const ok = await confirmModal(`종목(ID: ${id})을 삭제할까요? (메모 포함)`);
                        if (!ok) return;
                        await axios.delete(`/api/stocks/${id}`);
                        await load();
                    };
                });
            };
            await load();
            document.getElementById('searchBtn').onclick = load;
        }
    };
}
