/*가계부(캘린더) 페이지 - 홈*/
import { mount } from '../ui/mount.js';
import authStore from '../store/authStore.js';
import LedgerPage from '../pages/ledger/ledger.page.js';

/*재무 대시보드 페이지(돈 흐름 + 반복 항목 설정)*/
import DashboardPage from '../pages/dashboard/dashboard.page.js';

/*재무 대시보드 > 내역(한 달 가계부 내역 모아보기)*/
import HistoryPage from '../pages/history/history.page.js';

/*회원가입,로그인 페이지*/
import RegisterPage from '../pages/auth/register.page.js';
import LoginPage from '../pages/auth/login.page.js';

/*관리자 - 회원관리 페이지*/
import AdminMembersPage from '../pages/admin/members.page.js';

/*친구*/
import FriendsPage from '../pages/friends/friends.page.js';

/*친구 캘린더 비교*/
import ComparePage from '../pages/compare/compare.page.js';

/*서비스 소개*/
import AboutPage from '../pages/about/about.page.js';

/*마이페이지*/
import MyPage from '../pages/mypage/mypage.page.js';

/*공유 캘린더 (친구와 함께 쓰는 가계부/일정) - #/shared?id=3*/
import SharedCalendarPage from '../pages/shared/shared.page.js';

const routes = {
    /*홈 = 가계부(캘린더)*/
    '#/': LedgerPage,
    '#/calendar': LedgerPage,
    '#/money/flow': DashboardPage,
    '#/money/history': HistoryPage,
    /*예전 이름(캐시된 옛날 JS/북마크/공유링크 대비 하위호환용) - 새 코드는 위 이름을 쓴다*/
    '#/dashboard': LedgerPage,
    '#/money/dashboard': DashboardPage,
    /*로그인*/
    '#/login': LoginPage,
    '#/register': RegisterPage,
    /*관리자*/
    '#/admin/members': AdminMembersPage,
    /*친구*/
    '#/friends': FriendsPage,
    '#/compare': ComparePage,
    /*서비스 소개 - 로그인 없이도 볼 수 있음*/
    '#/about': AboutPage,
    /*마이페이지*/
    '#/mypage': MyPage,
    /*공유 캘린더*/
    '#/shared': SharedCalendarPage,
};

/**
 * 로그인 해야만 접속 가능
 * @type {string[]}
 */
const authRequiredRoutes = [
    '#/calendar',
    '#/money/flow',
    '#/money/history',
    '#/dashboard',
    '#/money/dashboard',
    '#/admin/members',
    '#/friends',
    '#/compare',
    '#/mypage',
    '#/shared',
];

export function navigate() {
    const hash = location.hash || '#/login';
    const base = hash.split('?')[0];
    const Page = routes[base] || NotFound;

    const needAuth = authRequiredRoutes.includes(base);

    // 🔐 로그인 여부는 boot() 때 이미 확인한 authStore를 그대로 믿는다.
    // (페이지 전환마다 /api/auth/me를 매번 다시 부르면 그만큼 느려지기만 함.
    //  세션이 중간에 끊긴 경우는 각 API 호출의 401 인터셉터가 처리한다.)
    if (needAuth && !authStore.isLoggedIn()) {
        if (base !== '#/login') {
            location.hash = '#/login';
        }
        mount(LoginPage);
        return;
    }

    mount(Page);
}
function NotFound() {
    return {
        title: '페이지를 찾을 수 없어요',
        render: () => `<div class="card">
                            <h2>404 Not Found </h2>
                            <p>(router.js 파일을 확인 해주세요.)</p></div>`,
        onMounted: () => {}
    };
}
