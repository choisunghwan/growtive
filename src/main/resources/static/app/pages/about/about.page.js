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
            <p class="subtitle">가계부와 일정을 한 곳에서 기록하고, 가족·친구와 함께 쓰는 공유 캘린더까지 — 돈과 시간을 같이 관리하는 캘린더 서비스입니다.</p>
          </div>

          <div class="card about-feature about-feature--banner">
            <img src="/assets/img/intro/intro-gauge.png" alt="상단바 실시간 급여·지출 게이지" class="about-feature-img about-feature-img--wide">
            <div class="about-feature-text">
              <h3>⏱️ 실시간 급여·지출 게이지</h3>
              <p>상단바만 봐도 지금 상황이 한눈에 보여요. 월급은 근무 시간에 맞춰 왼쪽부터 초 단위로 차오르고, 가계부에 지출을 등록하면 오른쪽부터 바로 채워집니다. 마이페이지에서 근무 시간과 <b>월급날</b>(매달 25일, 말일, 마지막 주 금요일 등 · 주말·공휴일이면 전 평일)을 정하면 월급날마다 0부터 다시 시작하고, 월급 금액은 고정 금액이나 가계부의 '월급' 내역 중에서 고를 수 있어요. 학생처럼 <b>용돈·정기 수입</b>을 받거나 수입 없이 <b>한 달 예산</b>으로 관리한다면, 남은 돈과 다음 받는 날까지 하루에 쓸 수 있는 돈(D-day)을 보여줘요.</p>
            </div>
          </div>

          <div class="card about-feature">
            <div class="about-feature-text">
              <h3>📅 가계부 캘린더</h3>
              <p>매일 수입/지출을 달력에 바로 기록하고, 한 달 전체 흐름을 한눈에 확인하세요. 월급·월세처럼 매달 반복되는 항목은 "매달 반복" 체크 한 번으로 자동 등록됩니다. 날짜를 누르면 그날 내역을 바로 수정·복사·삭제할 수 있어요.</p>
            </div>
            <img src="/assets/img/intro/intro-ledger.png?v=2" alt="가계부 캘린더 화면" class="about-feature-img">
          </div>

          <div class="card about-feature">
            <div class="about-feature-text">
              <h3>🗓️ 일정 캘린더</h3>
              <p>같은 캘린더에서 [가계부] / [일정] 전환만으로 일정도 관리할 수 있습니다. 하루짜리 일정은 물론 여러 날에 걸친 일정, 시간, 색상까지 자유롭게 지정하고, 달력·목록 두 가지로 볼 수 있어요.</p>
            </div>
            <img src="/assets/img/intro/intro-schedule.png?v=2" alt="일정 캘린더 화면" class="about-feature-img">
          </div>

          <div class="card about-feature">
            <div class="about-feature-text">
              <h3>👨‍👩‍👧 공유 캘린더</h3>
              <p>가족·연인·룸메이트와 가계부와 일정을 함께 쓰는 캘린더를 만들어보세요. 친구를 초대하면 수락한 사람끼리 같은 달력을 보고, 내역마다 누가 썼는지 이름표가 붙습니다. 내역은 꾹 눌러 끌어서 순서를 바꿀 수 있어요.</p>
              <p>💸 [정산]을 누르고 달력에서 정산할 날짜를 고르면(여행 기간처럼 여러 날은 2초 꾹 누른 채 끌어서 한 번에, 다른 달도 가능), 그날들 지출을 누가 얼마 냈는지 모아서 똑같이 나누려면 누가 누구에게 얼마를 보내면 되는지 바로 계산해줘요.</p>
              <p>만든 사람은 👑 관리자로 멤버 초대·캘린더 이름 변경·삭제를 맡고, 관리자 권한을 다른 멤버에게 넘길 수도 있어요. 누구나 언제든 나갈 수 있고, 내 개인 가계부 통계와는 따로 계산됩니다.</p>
            </div>
            <div class="about-feature-imgs">
              <img src="/assets/img/intro/intro-shared.png?v=2" alt="공유 캘린더 화면" class="about-feature-img">
              <img src="/assets/img/intro/intro-settle.png?v=2" alt="공유 캘린더 정산" class="about-feature-img">
            </div>
          </div>

          <div class="card about-feature">
            <div class="about-feature-text">
              <h3>📈 자산 흐름</h3>
              <p>가계부에 기록한 수입과 지출이 어디서 어디로 흘러가는지 흐름 차트로 한눈에 보여줍니다. ◀ ▶로 달을 옮겨 보고, 이번 달 총수입·총지출·잔액도 함께 요약해드려요.</p>
            </div>
            <img src="/assets/img/intro/intro-dashboard.png?v=2" alt="자산 흐름 화면" class="about-feature-img">
          </div>

          <div class="card about-feature">
            <div class="about-feature-text">
              <h3>🧾 자산 내역</h3>
              <p>한 달 내역을 날짜별로 한 줄씩 모아서 보고(줄을 누르면 수정·삭제), 전체 / 수입 / 지출만 골라볼 수 있어요. [검색]에서 기간(전체·연별·월별·주별·직접 입력), 카테고리, 메모 내용으로 찾고 결과 합계까지 바로 확인하세요.</p>
              <p>자주 보는 기간은 📌 핀으로 고정해두면 다음에 들어올 때 그 기간으로 바로 열립니다. (어느 기기에서든 그대로)</p>
            </div>
            <img src="/assets/img/intro/intro-history.png?v=2" alt="자산 내역 화면" class="about-feature-img">
          </div>

          <div class="card about-feature">
            <div class="about-feature-text">
              <h3>✨ 편의 기능</h3>
              <ul class="about-list">
                <li><b>📋 복사</b> — 가계부 내역·일정을 [복사] 한 번으로 내 캘린더·공유 캘린더 여러 곳에, 원하는 날짜로 똑같이 만들어요.</li>
                <li><b>🙂 닉네임</b> — 다른 사람에게는 실명 대신 닉네임으로 보여요. 마이페이지에서 언제든 바꿀 수 있어요.</li>
                <li><b>📲 홈 화면 설치</b> — 휴대폰 홈 화면에 앱처럼 설치해서 전체 화면으로 바로 열 수 있어요.</li>
                <li><b>💬 카카오 로그인</b> — 카카오 계정으로 바로 시작하거나 기존 계정에 연결할 수 있어요.</li>
                <li><b>🌙 다크 모드</b> — 밤에도 눈이 편하게 어두운 화면으로 바꿀 수 있어요.</li>
              </ul>
            </div>
            <img src="/assets/img/intro/intro-copy.png" alt="복사 화면" class="about-feature-img">
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
