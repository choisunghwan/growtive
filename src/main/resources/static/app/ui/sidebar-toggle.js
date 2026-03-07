// resources/static/app/ui/sidebar-toggle.js
(function () {
    const sidebar = document.getElementById('sidebar');
    const toggleBtn = document.getElementById('sidebar-toggle');

    if (!sidebar || !toggleBtn) return;

    toggleBtn.addEventListener('click', () => {
        if (window.innerWidth <= 768) {
            // 📱 모바일: 슬라이드 방식
            sidebar.classList.toggle('open');
        } else {
            // 🖥 PC: 접기 방식
            sidebar.classList.toggle('collapsed');
        }
    });
})();
