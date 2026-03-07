import { confirmModal } from '../../ui/modal.js';

export default function StockDetailPage() {
    return {
        title: '종목 상세',
        render: () => `
      <div class="card">
        <h2>📈 종목 상세</h2>

        <!-- 기본 정보 수정 -->
        <div class="form" style="margin-bottom:14px;">
          <div class="hint" id="meta"></div>
          <div>
            <label>종목명(표시용)</label>
            <input id="stockName" placeholder="예: 시놉시스">
          </div>
          <div class="btn-row">
            <button type="button" id="saveStockBtn" class="btn">기본정보 저장</button>
            <button type="button" id="deleteStockBtn" class="btn btn-danger">종목 삭제</button>
          </div>
        </div>

        <hr class="hr">

        <!-- 노트(나의 매수가/매도가/목표/메모) -->
        <form id="noteForm" class="form">
          <div>
            <label>매수가</label>
            <input id="buyPrice" inputmode="decimal" placeholder="예: 630000">
          </div>
          <div>
            <label>매도가</label>
            <input id="sellPrice" inputmode="decimal" placeholder="예: 680000">
          </div>
          <div>
            <label>목표가</label>
            <input id="targetPrice" inputmode="decimal" placeholder="예: 720000">
          </div>
          <div>
            <label>메모</label>
            <textarea id="memo" rows="3" placeholder="메모를 입력하세요"></textarea>
          </div>
          <div class="btn-row">
            <button type="submit" class="btn btn-primary">저장</button>
            <button type="button" id="delNoteBtn" class="btn btn-danger" style="display:none;">노트 삭제</button>
            <button type="button" id="backBtn" class="btn btn-ghost">← 목록으로</button>
          </div>
          <div id="msg" class="hint"></div>
        </form>
      </div>
    `,

        async onMounted() {
            const params = new URLSearchParams(location.hash.split('?')[1]);
            const id = params.get('id');
            if (!id) { document.getElementById('meta').textContent = '잘못된 접근입니다.'; return; }

            const { data } = await axios.get(`/api/stocks/${id}`);

            // 기본정보
            document.getElementById('meta').textContent = `${data.symbol} (${data.market})`;
            document.getElementById('stockName').value = data.name ?? '';

            // 노트
            document.getElementById('buyPrice').value    = data.buyPrice ?? '';
            document.getElementById('sellPrice').value   = data.sellPrice ?? '';
            document.getElementById('targetPrice').value = data.targetPrice ?? '';
            document.getElementById('memo').value        = data.memo ?? '';
            if (data.noteId) document.getElementById('delNoteBtn').style.display = 'inline-flex';

            // 기본정보 저장(종목명)
            document.getElementById('saveStockBtn').onclick = async () => {
                const name = document.getElementById('stockName').value.trim();
                await axios.put(`/api/stocks/${id}`, { name });
                document.getElementById('msg').innerHTML = '<span style="color:green">기본정보 저장 완료</span>';
            };

            // 종목 삭제(전체)
            document.getElementById('deleteStockBtn').onclick = async () => {
                const ok = await confirmModal(`이 종목을 삭제할까요? (노트 포함)`);
                if (!ok) return;
                await axios.delete(`/api/stocks/${id}`);
                location.hash = '#/stocks';
            };

            // 노트 저장
            document.getElementById('noteForm').onsubmit = async (e) => {
                e.preventDefault();
                const payload = {
                    buyPrice: document.getElementById('buyPrice').value || null,
                    sellPrice: document.getElementById('sellPrice').value || null,
                    targetPrice: document.getElementById('targetPrice').value || null,
                    memo: document.getElementById('memo').value || null
                };
                const res = await axios.post(`/api/stocks/${id}/note`, payload);
                document.getElementById('msg').innerHTML = '<span style="color:green">저장 완료!</span>';
                if (res?.data) document.getElementById('delNoteBtn').style.display = 'inline-flex';
            };

            // 노트 삭제
            document.getElementById('delNoteBtn').onclick = async () => {
                const ok = await confirmModal('노트를 삭제할까요?');
                if (!ok) return;
                await axios.delete(`/api/stocks/${id}/note/${data.noteId}`);
                document.getElementById('buyPrice').value = '';
                document.getElementById('sellPrice').value = '';
                document.getElementById('targetPrice').value = '';
                document.getElementById('memo').value = '';
                document.getElementById('delNoteBtn').style.display = 'none';
                document.getElementById('msg').innerHTML = '<span style="color:#b91c1c">노트 삭제 완료</span>';
            };

            // 목록으로
            document.getElementById('backBtn').onclick = () => location.hash = '#/stocks';
        }
    };
}
