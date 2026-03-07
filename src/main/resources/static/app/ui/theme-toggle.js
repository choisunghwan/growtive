// resources/static/app/ui/theme-toggle.js

(function () {
    const STORAGE_KEY = "growtive-theme";

    function applyTheme(theme) {
        const root = document.documentElement;

        if (theme === "dark") {
            root.classList.add("dark");
        } else {
            root.classList.remove("dark");
        }
    }

    function updateButtonIcon(btn, theme) {
        if (!btn) return;
        // 라이트 모드일 때는 🌙 아이콘 보여주고,
        // 다크 모드일 때는 ☀️ 아이콘 보여줌
        btn.textContent = theme === "dark" ? "☀️" : "🌙";
    }

    function getPreferredTheme() {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored === "dark" || stored === "light") {
            return stored;
        }

        // 저장된 값이 없다면 시스템 다크모드 선호 여부 사용
        if (window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches) {
            return "dark";
        }

        return "light";
    }

    function initThemeToggle() {
        const btn = document.getElementById("theme-toggle");
        if (!btn) return;

        // 초기 테마 결정 + 적용
        let currentTheme = getPreferredTheme();
        applyTheme(currentTheme);
        updateButtonIcon(btn, currentTheme);

        // 클릭 시 토글
        btn.addEventListener("click", () => {
            currentTheme = currentTheme === "dark" ? "light" : "dark";
            applyTheme(currentTheme);
            updateButtonIcon(btn, currentTheme);
            localStorage.setItem(STORAGE_KEY, currentTheme);
        });
    }

    // DOM 로드 후 자동 실행
    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", initThemeToggle);
    } else {
        initThemeToggle();
    }
})();
