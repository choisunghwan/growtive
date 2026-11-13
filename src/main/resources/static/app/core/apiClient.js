// /static/app/apiClient.js
import authStore from '../store/authStore.js';

// ───────────────────────────────
// 공통 Axios 초기화
// ───────────────────────────────
export function setupAxios() {
    axios.defaults.baseURL = ''; // 같은 도메인

    // ✅ 요청 인터셉터: FormData면 Content-Type 제거(브라우저가 boundary 자동 설정)
    axios.interceptors.request.use((cfg) => {
        const isForm = (typeof FormData !== 'undefined') && cfg.data instanceof FormData;
        const isBlob = (typeof Blob !== 'undefined') && cfg.data instanceof Blob;

        // JSON 바디에는 기본 Content-Type 부여 (이미 지정되어 있으면 건드리지 않음)
        if (!isForm && !isBlob && cfg.method && ['post', 'put', 'patch'].includes(cfg.method.toLowerCase())) {
            cfg.headers = cfg.headers || {};
            if (!cfg.headers['Content-Type']) {
                cfg.headers['Content-Type'] = 'application/json';
            }
        }

        // FormData 업로드는 명시적으로 제거 (중복/잘못된 헤더 방지)
        if (isForm && cfg.headers) {
            delete cfg.headers['Content-Type'];
        }

        return cfg;
    });

    axios.interceptors.response.use(
        (res) => res,
        (err) => {
            // 세션이 중간에 끊긴 상태로 API를 호출하면(401), 로컬 로그인 상태를 지우고
            // 로그인 화면으로 보낸다. 로그인 화면 자체의 실패(예: 비밀번호 틀림)까지
            // 리다이렉트하면 안 되니 로그인 화면에 있을 때는 건드리지 않는다.
            // 로그인 없이 볼 수 있는 화면(회원가입·서비스 소개)과, 앱 시작 때의 로그인 여부 확인(/api/auth/me)은 제외
            const publicPage = ['#/login', '#/register', '#/about'].some(h => location.hash.startsWith(h));
            const isLoginCheck = (err.config?.url || '').includes('/api/auth/me');
            if (err.response && err.response.status === 401 && !publicPage && !isLoginCheck) {
                authStore.clear();
                location.hash = '#/login';
            }
            return Promise.reject(err);
        }
    );
}

// 간단 래퍼
export const api = {
    get: (url, config) => axios.get(url, config),
    post: (url, data, config) => axios.post(url, data, config),
    put: (url, data, config) => axios.put(url, data, config),
    del: (url, config) => axios.delete(url, config),
};
