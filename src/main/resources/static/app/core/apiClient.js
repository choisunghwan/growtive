// /static/app/apiClient.js

// 라우트 prefix 한 곳에서 관리 (백엔드가 /api/documents 라면 여기만 바꾸면 됨)
const DOCS = '/api/docs';

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
        (err) => Promise.reject(err)
    );
}

// 간단 래퍼
export const api = {
    get: (url, config) => axios.get(url, config),
    post: (url, data, config) => axios.post(url, data, config),
    put: (url, data, config) => axios.put(url, data, config),
    del: (url, config) => axios.delete(url, config),
};

/* =========================================================
 * DocuMind 전용 API
 *  - 업로드/목록/요약/질의
 *    (백엔드 엔드포인트에 맞춰 DOCS 상수만 조정하면 됨)
 * ========================================================= */

// 문서 업로드
export async function uploadDocument(file) {
    const form = new FormData();
    form.append('file', file); // @RequestParam("file")와 동일해야 함

    // ⚠️ 여기서 Content-Type 지정 금지 (인터셉터가 제거함)
    const { data } = await axios.post(`${DOCS}/upload`, form);
    return data; // {id, title, ...}
}

// 문서 목록 조회
export async function listDocuments() {
    const { data } = await api.get(DOCS);
    return data; // DocumentDto[]
}

// 특정 문서 요약 생성
export async function summarizeDocument(docId) {
    const { data } = await api.post(`${DOCS}/${docId}/summarize`);
    return data; // SummaryDto
}

// 특정 문서에 질의
export async function askDocument(docId, question) {
    const { data } = await api.post(`${DOCS}/${docId}/ask`, { question });
    return data; // QaLogDto
}

// 문서 삭제
export async function deleteDocument(id) {
    await api.del(`/api/docs/${id}`);
}
