/*대시보드 페이지*/
import { mount } from '../ui/mount.js';
import DashboardPage from '../pages/dashboard/dashboard.page.js';



/*회원관리 페이지*/
import UsersListPage from '../pages/users/list.page.js';
import UsersNewPage from '../pages/users/new.page.js';


import MoneyTemplatePage from "../pages/money/money-template.page.js";



/*주식관리 페이지*/
import StockListPage from '../pages/stocks/list.page.js';
import StockDetailPage from '../pages/stocks/detail.page.js';
import StockSearchPage from '../pages/stocks/search.page.js';

/*문서관리 페이지*/
import DocuMindPage from '../pages/documind/documind.page.js';

/*메신저*/
import ChatPage from '../pages/chat/chat.page.js';

/*서비스 관리*/
import ProvidersPage from "../pages/providers/providers.page.js";

/*회원가입,로그인 페이지*/
import RegisterPage from '../pages/auth/register.page.js';
import LoginPage from '../pages/auth/login.page.js';

const routes = {
    /*사용자 페이지*/
    '#/': DashboardPage,
    '#/dashboard': DashboardPage,
    '#/money/templates': MoneyTemplatePage,
    /*회원관리*/
    '#/users': UsersListPage,
    '#/users/new': UsersNewPage,
    /*로그인*/
    '#/login': LoginPage,
    '#/register': RegisterPage,
    /*주식관리*/
    '#/stocks': StockListPage, //목록
    '#/stocks/detail': StockDetailPage, //상세+메모 CRUD
    '#/stocks/search': StockSearchPage, //종목 등록
    /*문서관리*/
    '#/documind': DocuMindPage,
    /*메신저*/
    '#/chat': ChatPage,
    /*서비스관리*/
    '#/providers': ProvidersPage,
};

/**
 * 로그인 해야만 접속 가능
 * @type {string[]}
 */
const authRequiredRoutes = [
    '#/dashboard',
    '#/money/templates',
    '#/users',
    '#/users/new',
    '#/stocks',
    '#/stocks/detail',
    '#/stocks/search',
    '#/documind',
    '#/chat',
    '#/providers'
];

export async function navigate() {
    const hash = location.hash || '#/login';
    const base = hash.split('?')[0];
    const Page = routes[base] || NotFound;

    const needAuth = authRequiredRoutes.includes(base);

    // 🔐 로그인 페이지는 무조건 통과
    if (needAuth) {
        try {
            await axios.get('/api/auth/me');
        } catch (e) {
            if (base !== '#/login') {
                location.hash = '#/login';
            }
            mount(LoginPage); // ✅ 강제로 로그인 페이지 렌더
            return;
        }
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
