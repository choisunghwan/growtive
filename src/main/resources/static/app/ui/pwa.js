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
        notify('installed');
    });

    window.growtivePwa = {
        /** 이미 홈 화면 앱(standalone)으로 실행 중인지 */
        isStandalone() {
            return window.matchMedia('(display-mode: standalone)').matches
                || window.navigator.standalone === true; // iOS Safari
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
