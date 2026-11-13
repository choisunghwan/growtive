// resources/static/app/ui/install-banner.js
// 📲 모바일 브라우저로 접속했을 때 "홈 화면에 앱 설치" 안내 카드
//
// 브라우저마다 설치 방법이 달라서 상황별로 다르게 안내한다.
//  - 안드로이드 크롬/삼성인터넷 등 : [설치하기] 버튼 → 브라우저 설치창 바로 띄움
//  - 아이폰/아이패드(사파리, 크롬)  : 공유 버튼 → '홈 화면에 추가' 순서 안내
//  - 카카오톡/네이버/인스타 등 인앱 브라우저 : 설치가 안 되므로 외부 브라우저로 열도록 안내
//  - 그 외 모바일 브라우저        : 브라우저 메뉴에서 '홈 화면에 추가' 안내
// 이미 홈 화면 앱으로 실행 중이거나 PC면 아무것도 안 보여준다.

const DISMISS_KEY = 'growtive-install-dismissed-at';
const DISMISS_DAYS = 7;

function detectEnv() {
    const ua = navigator.userAgent || '';
    // iPadOS 13+ 사파리는 UA가 맥과 같아서 터치 포인트로 구분
    const isIOS = /iPhone|iPad|iPod/i.test(ua)
        || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    const isAndroid = /Android/i.test(ua);
    const isMobile = isIOS || isAndroid || /Mobi/i.test(ua);
    const isKakao = /KAKAOTALK/i.test(ua);
    const isInApp = isKakao || /NAVER\(inapp|Instagram|FBAN|FBAV|Line\/|DaumApps|everytimeApp|; wv\)/i.test(ua);
    return { isIOS, isAndroid, isMobile, isKakao, isInApp };
}

function isDismissed() {
    try {
        const at = Number(localStorage.getItem(DISMISS_KEY));
        return at && Date.now() - at < DISMISS_DAYS * 24 * 60 * 60 * 1000;
    } catch {
        return false;
    }
}

function dismiss() {
    try {
        localStorage.setItem(DISMISS_KEY, String(Date.now()));
    } catch { /* 저장 못 해도 이번 화면에서만 닫히면 충분 */ }
}

// iOS 사파리 공유 아이콘(네모 + 위 화살표)
const IOS_SHARE_ICON = `
    <svg class="install-inline-icon" viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
        <path d="M12 3v12M7.5 7.5 12 3l4.5 4.5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M8 11H6.5A1.5 1.5 0 0 0 5 12.5v7A1.5 1.5 0 0 0 6.5 21h11a1.5 1.5 0 0 0 1.5-1.5v-7a1.5 1.5 0 0 0-1.5-1.5H16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
    </svg>`;

function bodyHtml(env, canPrompt) {
    if (env.isInApp) {
        const kakaoBtn = env.isKakao
            ? `<button type="button" class="install-action-btn" data-install-action="external">외부 브라우저로 열기</button>`
            : '';
        return `
            <p class="install-desc">
                지금 앱 안의 브라우저로 보고 계셔서 바로 설치할 수 없어요.
                ${env.isIOS ? '사파리로' : '크롬으로'} 열면 홈 화면에 추가할 수 있어요.
            </p>
            ${kakaoBtn}`;
    }

    if (env.isIOS) {
        return `
            <ol class="install-steps">
                <li>하단(또는 상단)의 공유 버튼 ${IOS_SHARE_ICON} 을 누르고</li>
                <li><b>'홈 화면에 추가'</b>를 선택하세요</li>
            </ol>`;
    }

    if (canPrompt) {
        return `
            <p class="install-desc">앱처럼 전체 화면으로, 홈 화면에서 바로 열 수 있어요.</p>
            <button type="button" class="install-action-btn" data-install-action="prompt">홈 화면에 설치하기</button>`;
    }

    return `
        <p class="install-desc">
            브라우저 메뉴(<b>⋮</b> 또는 <b>≡</b>)에서
            <b>'홈 화면에 추가'</b> 또는 <b>'앱 설치'</b>를 눌러주세요.
        </p>`;
}

/**
 * 설치 안내 카드를 slot 안에 그린다. (모바일 + 미설치 + 닫은 적 없음 일 때만)
 * @param {HTMLElement} slot
 */
export function mountInstallBanner(slot) {
    const pwa = window.growtivePwa;
    if (!slot || !pwa) return;

    const env = detectEnv();
    if (!env.isMobile || pwa.isStandalone() || isDismissed()) {
        slot.innerHTML = '';
        return;
    }

    const draw = () => {
        slot.innerHTML = `
            <div class="install-card" role="region" aria-label="홈 화면에 앱 설치">
                <img class="install-app-icon" src="/assets/img/icon-192.png" alt="" width="44" height="44">
                <div class="install-body">
                    <strong class="install-title">GrowTive 앱으로 설치하기</strong>
                    ${bodyHtml(env, pwa.canPrompt())}
                </div>
                <button type="button" class="install-close" data-install-action="close" aria-label="설치 안내 닫기">✕</button>
            </div>`;
    };
    draw();

    slot.addEventListener('click', async (e) => {
        const action = e.target.closest('[data-install-action]')?.dataset.installAction;
        if (action === 'close') {
            dismiss();
            slot.innerHTML = '';
        } else if (action === 'prompt') {
            const outcome = await pwa.prompt();
            if (outcome === 'accepted') slot.innerHTML = '';
            else draw(); // 취소하면 이벤트가 소모되므로 수동 안내로 바뀜
        } else if (action === 'external') {
            // 카카오톡 인앱 브라우저 → 기본 브라우저로 현재 주소 열기
            location.href = 'kakaotalk://web/openExternal?url=' + encodeURIComponent(location.href);
        }
    });

    // 설치 가능 상태가 늦게 오거나, 설치가 끝났을 때 카드 갱신
    const onPwa = (e) => {
        if (!slot.isConnected) {
            window.removeEventListener('growtive:pwa', onPwa);
            return;
        }
        if (e.detail.type === 'installed') slot.innerHTML = '';
        else if (slot.firstElementChild) draw();
    };
    window.addEventListener('growtive:pwa', onPwa);
}
