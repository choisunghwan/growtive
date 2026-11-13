import authStore from '../../store/authStore.js';

export default function AboutPage() {
    return {
        title: '서비스 소개',

        render() {
            return `
        <section class="about-page">

          <div class="card about-hero">
            <img src="/assets/img/icon-192.png?v=3" alt="" class="about-hero-icon">
            <h1 class="title">GROWTIVE</h1>
            <p class="subtitle">가계부와 일정을 한 곳에서, 가족·친구와 함께 관리하는 개인 재무·캘린더 서비스입니다.</p>
          </div>

          <div class="card about-feature about-feature--banner">
            <img src="/assets/img/intro/intro-gauge.png" alt="상단바 실시간 급여·지출 게이지" class="about-feature-img about-feature-img--wide">
            <div class="about-feature-text">
              <h3>⏱️ 실시간 급여·지출 게이지</h3>
              <p>상단바만 봐도 이번 달 상황이 한눈에 보여요. 월급은 근무 시간에 맞춰 왼쪽부터 초 단위로 차오르고, 가계부에 지출을 등록하면 오른쪽부터 바로 채워집니다. 마이페이지에서 근무 시간만 설정하면 바로 시작돼요.</p>
            </div>
          </div>

          <div class="card about-feature">
            <div class="about-feature-text">
              <h3>📅 가계부 캘린더</h3>
              <p>매일 수입/지출을 달력에 바로 기록하고, 한 달 전체 흐름을 한눈에 확인하세요. 월급·월세처럼 매달 반복되는 항목은 "매달 반복" 체크 한 번으로 자동 등록됩니다.</p>
            </div>
            <img src="/assets/img/intro/intro-ledger.png" alt="가계부 캘린더 화면" class="about-feature-img">
          </div>

          <div class="card about-feature">
            <div class="about-feature-text">
              <h3>🗓️ 일정 캘린더</h3>
              <p>같은 캘린더에서 탭 전환만으로 일정도 관리할 수 있습니다. 하루짜리 일정은 물론 기간이 있는 일정, 시간, 색상 태그까지 자유롭게 지정하세요.</p>
            </div>
            <img src="/assets/img/intro/intro-schedule.png" alt="일정 캘린더 화면" class="about-feature-img">
          </div>

          <div class="card about-feature">
            <div class="about-feature-text">
              <h3>📈 재무 대시보드 (자산 흐름)</h3>
              <p>가계부에 기록한 수입과 지출이 어디서 어디로 흘러가는지 Sankey 차트로 한눈에 보여줍니다. 이번 달 총수입·총지출·잔액도 함께 요약해드려요.</p>
            </div>
            <img src="/assets/img/intro/intro-dashboard.png" alt="재무 대시보드 화면" class="about-feature-img">
          </div>

          <div class="card about-feature">
            <div class="about-feature-text">
              <h3>👫 소셜 (친구 캘린더 비교)</h3>
              <p>가족, 친구, 연인과 아이디로 서로 연결하고 캘린더를 나란히 놓고 비교해보세요. 단, 양쪽이 각자 공유 기간을 지정해야만 비교가 가능해서 사생활은 안전하게 지켜집니다. 항목별로 숨기기도 가능합니다.</p>
            </div>
            <img src="/assets/img/intro/intro-compare.png" alt="친구 캘린더 비교 화면" class="about-feature-img about-feature-img--wide">
          </div>

          <div class="card about-cta" id="aboutCta">
            <!-- 로그인 상태에 따라 onMounted에서 채워짐 -->
          </div>

        </section>
      `;
        },

        onMounted() {
            const cta = document.getElementById('aboutCta');
            const loggedIn = authStore.isLoggedIn();

            if (loggedIn) {
                cta.innerHTML = `
                    <h3>이미 사용 중이시네요 👋</h3>
                    <p class="subtitle">가계부로 돌아가서 이번 달 내역을 확인해보세요.</p>
                    <a href="#/calendar" class="btn primary">가계부로 이동</a>
                `;
            } else {
                cta.innerHTML = `
                    <h3>지금 시작해보세요</h3>
                    <p class="subtitle">회원가입은 무료이고, 몇 초면 충분합니다.</p>
                    <a href="#/register" class="btn primary">회원가입 하러 가기</a>
                    <a href="#/login" class="btn" style="margin-left:8px;">로그인</a>
                `;
            }
        }
    };
}
