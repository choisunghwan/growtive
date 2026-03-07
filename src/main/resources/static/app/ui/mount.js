export function mount(Page) {
    const app = document.getElementById('app');
    if (!app) {
        console.error('#app 엘리먼트를 찾을 수 없습니다.');
        return;
    }

    // ✅ 함수/객체 모두 지원
    const page = (typeof Page === 'function') ? Page() : Page;

    // ✅ 가드: 올바른 형태인지 확인
    if (!page || typeof page.render !== 'function') {
        app.innerHTML = `
      <div class="card">
        <h2>구성 오류</h2>
        <p>페이지 컴포넌트가 올바르지 않습니다.</p>
      </div>`;
        console.error('[mount] Invalid Page:', Page);
        return;
    }

    // ✅ 렌더링
    document.title = page.title ? `GROWTIVE · ${page.title}` : 'GROWTIVE';
    app.innerHTML = page.render();

    // ✅ 렌더 후 훅에 root 전달
    if (typeof page.onMounted === 'function') page.onMounted(app);
}
