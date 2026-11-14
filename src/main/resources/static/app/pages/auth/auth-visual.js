// src/main/resources/static/app/pages/auth/auth-visual.js
// 로그인/회원가입 화면 좌측 브랜드 비주얼 패널 (두 페이지가 공유)

export function authVisualHtml() {
    return `
        <div class="auth-visual">
            <div class="auth-blob auth-blob-1"></div>

            <!-- 💸 우리 앱 "돈 흐름"(생키 차트)·상단바 게이지와 같은 결의 배경 흐름:
                 수입(초록)이 흘러 들어와 → 가운데서 만나고 → 지출(빨강)이 흘러 나간다 -->
            <svg class="auth-flow" viewBox="0 0 640 900" preserveAspectRatio="none" aria-hidden="true">
                <defs>
                    <linearGradient id="authFlowIncome" x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0%" stop-color="#4ade80"/>
                        <stop offset="100%" stop-color="#2563eb"/>
                    </linearGradient>
                    <linearGradient id="authFlowExpense" x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0%" stop-color="#2563eb"/>
                        <stop offset="100%" stop-color="#f87171"/>
                    </linearGradient>
                </defs>
                <path fill="url(#authFlowIncome)" opacity="0.55" d="M-40,120 C100,80 200,220 340,200 C420,188 440,140 460,110 L460,190 C440,220 420,260 340,280 C200,300 100,210 -40,250 Z"/>
                <path fill="url(#authFlowExpense)" opacity="0.5" d="M180,600 C280,650 380,540 460,570 C540,598 600,660 680,620 L680,740 C600,780 540,720 460,690 C380,660 280,770 180,720 Z"/>
            </svg>

            <div class="auth-visual-inner">
                <div class="auth-brand">
                    <img src="/assets/img/icon-192.png?v=2" alt="" class="auth-brand-icon">
                    GROWTIVE
                </div>

                <h1 class="auth-headline">캘린더 하나로<br>일정과 가계부를 함께</h1>
                <p class="auth-sub">
                    실시간 급여 확인부터 함께 쓰는 공유 캘린더까지,<br>
                    목표에 맞는 자산 관리를 시작하세요.
                </p>

                <div class="auth-stats">
                    <div class="auth-stat auth-stat-income">
                        <span class="auth-stat-label">이번 달 수입</span>
                        <span class="auth-stat-value">+2,480,000원</span>
                    </div>
                    <div class="auth-stat auth-stat-expense">
                        <span class="auth-stat-label">이번 달 지출</span>
                        <span class="auth-stat-value">-860,000원</span>
                    </div>
                </div>

                <div class="auth-features">
                    <div class="auth-feature">
                        <div class="auth-feature-icon">📅</div>
                        <div>
                            <div class="auth-feature-title">일정 + 가계부, 캘린더 하나로</div>
                            <div class="auth-feature-desc">같은 캘린더에서 일정 관리와 수입·지출 기록을 함께 하세요</div>
                        </div>
                    </div>
                    <div class="auth-feature">
                        <div class="auth-feature-icon">⏱️</div>
                        <div>
                            <div class="auth-feature-title">실시간 급여 카운터</div>
                            <div class="auth-feature-desc">지금까지 얼마나 벌었는지 실시간으로 확인</div>
                        </div>
                    </div>
                    <div class="auth-feature">
                        <div class="auth-feature-icon">👫</div>
                        <div>
                            <div class="auth-feature-title">공유 캘린더</div>
                            <div class="auth-feature-desc">가족·친구와 가계부와 일정을 함께 써보세요</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
}
