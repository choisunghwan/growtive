// resources/static/app/ui/pwa.js
// 서비스워커 등록 + 홈 화면 설치(PWA) 지원
//
// - 일반 스크립트(모듈 아님)라 페이지 초기에 바로 실행된다.
//   크롬/삼성인터넷은 'beforeinstallprompt' 이벤트를 한 번만 보내주기 때문에
//   로그인 화면이 그려지기 전에 미리 받아서 window.growtivePwa에 보관해 둔다.
// - 실제 설치 안내 UI는 app/ui/install-banner.js 가 이 객체를 사용해서 그린다.

(function () {
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            navigator.serviceWorker.register('/sw.js').catch(() => {
                // 등록 실패해도 앱 사용에는 지장 없음 (설치 배너만 안 뜨는 정도)
            });
        });
    }

    let deferredPrompt = null;

    // 📲 '설치됨' 기억: 브라우저로 접속하면 홈 화면 앱이 있는지 알 수 없어서,
    //    앱(standalone)으로 한 번이라도 열렸거나 설치 완료 이벤트가 오면 표시해 둔다.
    //    (안드로이드는 설치된 앱과 크롬이 같은 저장소를 써서 브라우저에서도 이 값이 보임)
    const INSTALLED_KEY = 'growtive-app-installed';
    function markInstalled() {
        try { localStorage.setItem(INSTALLED_KEY, '1'); } catch { /* 무시 */ }
    }
    function isMarkedInstalled() {
        try { return localStorage.getItem(INSTALLED_KEY) === '1'; } catch { return false; }
    }

    function notify(type) {
        window.dispatchEvent(new CustomEvent('growtive:pwa', { detail: { type } }));
    }

    // 안드로이드 크롬/엣지/삼성인터넷: 설치 가능 상태가 되면 이 이벤트가 온다
    window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault(); // 브라우저 기본 미니 배너 대신 우리 화면에서 안내
        deferredPrompt = e;
        notify('installable');
    });

    window.addEventListener('appinstalled', () => {
        deferredPrompt = null;
        markInstalled();
        notify('installed');
    });

    const isStandalone = () => window.matchMedia('(display-mode: standalone)').matches
        || window.navigator.standalone === true; // iOS Safari
    if (isStandalone()) markInstalled();

    window.growtivePwa = {
        /** 이미 홈 화면 앱(standalone)으로 실행 중인지 */
        isStandalone,

        /** 이 기기에 앱이 설치돼 있다고 알고 있는지 (앱으로 열린 적 있음 / 설치 완료 / '이미 설치했어요') */
        isKnownInstalled() {
            return isMarkedInstalled();
        },

        markInstalled,

        /** 크롬(안드로이드)에 '이 웹앱 설치돼 있어?'라고 물어봄 (지원 안 하면 false) */
        async checkInstalled() {
            try {
                if (!navigator.getInstalledRelatedApps) return false;
                const apps = await navigator.getInstalledRelatedApps();
                if (apps && apps.length > 0) { markInstalled(); return true; }
            } catch { /* 지원 안 함 */ }
            return false;
        },

        /** 버튼 한 번으로 설치창을 띄울 수 있는 상태인지 (안드로이드 크롬 계열) */
        canPrompt() {
            return !!deferredPrompt;
        },

        /** 설치창 띄우기. 결과: 'accepted' | 'dismissed' | 'unavailable' */
        async prompt() {
            if (!deferredPrompt) return 'unavailable';
            const evt = deferredPrompt;
            deferredPrompt = null; // 한 번 쓴 이벤트는 재사용 불가
            evt.prompt();
            try {
                const { outcome } = await evt.userChoice;
                return outcome;
            } catch {
                return 'dismissed';
            }
        },
    };
})();
