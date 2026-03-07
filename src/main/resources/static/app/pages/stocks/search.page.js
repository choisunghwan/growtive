// /app/pages/stocks/search.page.js
export default function StockSearchPage() {
    return {
        title: '종목 등록',
        render: () => `
      <div class="card">
        <h2>🔍 종목 등록</h2>
        <form id="regForm">
          <label>심볼 (예: AAPL, TSLA, 005930)</label>
          <input id="symbol" required>
          <label>시장</label>
          <select id="market">
            <option value="US">미국</option>
            <option value="KR">한국</option>
          </select>
          <label>이름</label>
          <input id="name" required>
          <div style="margin-top:10px;">
            <button type="submit">등록</button>
          </div>
        </form>
        <div id="msg"></div>
      </div>
    `,
        onMounted() {
            document.getElementById('regForm').onsubmit = async (e) => {
                e.preventDefault();
                const payload = {
                    symbol: document.getElementById('symbol').value,
                    market: document.getElementById('market').value,
                    name: document.getElementById('name').value
                };
                try {
                    const { data } = await axios.post('/api/stocks', payload);
                    document.getElementById('msg').innerHTML = `<span style="color:green;">등록 완료 (ID: ${data})</span>`;
                    e.target.reset();
                } catch (err) {
                    const msg = err.response?.data || err.message;
                    document.getElementById('msg').innerHTML = `<span style="color:red;">등록 실패: ${msg}</span>`;
                }
            };
        }
    };
}
