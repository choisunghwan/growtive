/**
 * authStore.js
 *
 * 🔐 로그인 사용자 전역 상태 관리 Store
 *
 * 역할:
 * - 현재 로그인한 사용자 정보를 메모리에 보관
 * - 앱 시작 시 서버 세션(/api/auth/me)과 동기화
 * - 모든 페이지에서 로그인 여부 / userId 공통 사용
 *
 * ❗ 주의
 * - localStorage에 userId 저장 ❌
 * - 실제 인증/보안은 서버(HttpSession)가 담당
 */

// import axios from 'axios';

const authStore = {
    /**
     * 현재 로그인한 사용자 정보
     * 예시: { userId: 'choi.sunghwan' }
     * 로그인 안 된 경우: null
     */
    user: null,

    /**
     * 앱 최초 로드 시 1회 호출
     * 서버 세션에 로그인 정보가 있는지 확인
     *
     * @returns {Object|null} 로그인 유저 정보
     */
    async load() {
        try {
            const res = await axios.get('/api/auth/me');
            this.user = res.data;
            return this.user;
        } catch (e) {
            // 세션 없음 or 만료
            this.user = null;
            return null;
        }
    },

    /**
     * 로그인 여부 체크
     * @returns {boolean}
     */
    isLoggedIn() {
        return !!this.user;
    },

    /**
     * 현재 로그인한 사용자 ID 반환
     * @returns {string|undefined}
     */
    getUserId() {
        return this.user?.userId;
    },

    /**
     * 로그아웃 시 호출 (프론트 상태 초기화)
     */
    clear() {
        this.user = null;
    }
};

export default authStore;
