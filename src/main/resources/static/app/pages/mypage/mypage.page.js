import authStore from '../../store/authStore.js';
import { escapeHtml, openModal } from '../../ui/modal.js';
import { renderUserPanel } from '../../ui/topbar-user.js';
import { renderSharedMenu } from '../../ui/shared-menu.js';
import { initTopbarSalaryTicker } from '../../ui/salary-ticker.js';
import { hasPayRule, payPeriod, formatPayday } from '../../core/payday.js';

export default function MyPage() {
    return {
        title: '마이페이지',

        render() {
            return `
            <section class="mypage-page">
                <div class="card">
                    <h1 class="title">마이페이지</h1>
                    <p class="subtitle">내 계정 정보를 확인하고 관리합니다.</p>
                    <div id="myInfoArea" style="margin-top:16px;"></div>
                </div>

                <div class="card" style="margin-top:20px;">
                    <h3>계정 연결</h3>
                    <p class="subtitle" style="margin-top:6px;">카카오 계정을 연결하면 다음부터 카카오로 바로 로그인할 수 있어요.</p>
                    <div id="accountLinkArea" style="margin-top:12px;"></div>
                </div>

                <div class="card" style="margin-top:20px;">
                    <h3>⏱️ 상단 게이지 설정</h3>
                    <p class="subtitle" style="margin-top:6px;">상단바 게이지가 이 설정에 맞춰 움직여요. 월급·용돈처럼 받는 돈이나 한 달 예산을 정하면, 시작일마다 새로 시작해요.</p>
                    <form id="workScheduleForm" class="form gauge-setting" style="margin-top:14px; max-width:440px;">
                        <label class="history-search-label payday-label" for="payRule">📅 시작일</label>
                        <select id="payRule">
                            <option value="">매달 1일</option>
                            <option value="DAY">매달 정해진 날짜</option>
                            <option value="LAST_DAY">매달 말일</option>
                            <option value="NTH_WEEKDAY">매달 몇째 주 무슨 요일</option>
                        </select>
                        <div class="payday-row" id="payDayRow" hidden>
                            매달 <select id="payDay">${Array.from({ length: 31 }, (_, i) => `<option value="${i + 1}">${i + 1}일</option>`).join('')}</select>
                        </div>
                        <div class="payday-row" id="payWeekRow" hidden>
                            매달
                            <select id="payWeek">
                                <option value="1">첫째</option><option value="2">둘째</option><option value="3">셋째</option>
                                <option value="4">넷째</option><option value="-1">마지막</option>
                            </select> 주
                            <select id="payWeekday">
                                ${['일', '월', '화', '수', '목', '금', '토'].map((d, i) => `<option value="${i}"${i === 5 ? ' selected' : ''}>${d}요일</option>`).join('')}
                            </select>
                        </div>
                        <div class="payday-row" id="payAdjustRow" hidden>
                            주말·공휴일이면
                            <select id="payAdjust">
                                <option value="BEFORE">전 평일</option>
                                <option value="AFTER">다음 평일</option>
                                <option value="KEEP">그날 그대로</option>
                            </select>
                        </div>
                        <p class="hint payday-preview" id="paydayPreview"></p>

                        <span class="history-search-label payday-label">💵 금액</span>
                        <label class="payday-radio"><input type="radio" name="salaryMode" value="" checked>
                            <span>설정 안 함</span></label>
                        <label class="payday-radio"><input type="radio" name="salaryMode" value="FIXED">
                            <span>고정 금액</span></label>
                        <label class="payday-radio"><input type="radio" name="salaryMode" value="BUDGET">
                            <span>한 달 예산</span></label>
                        <input type="text" id="salaryAmount" inputmode="numeric" placeholder="예: 300,000" hidden>

                        <div class="gauge-auto" id="autoRecordRow" hidden>
                            <div class="payday-row">
                                📝 시작일마다 가계부에
                                <select id="incomeCategory">
                                    ${['용돈', '월급', '부수입', '이자/배당', '기타'].map(c => `<option value="${c}">${c}</option>`).join('')}
                                </select>
                                수입으로 자동 기록
                            </div>
                            <p class="hint payday-preview">설정한 뒤 다가오는 시작일부터 기록돼요. 지난 기간은 넣지 않아요. 그달 금액이 다르면 기록된 내역을 고치면 게이지도 따라가요.</p>
                            <p class="hint payday-preview gauge-dup" id="dupNotice" hidden></p>
                        </div>

                        <label class="payday-radio" id="workGaugeRow" hidden><input type="checkbox" id="workGauge">
                            <span>근무 시간에 따라 쌓이게 보기 <span class="hint">(직장인)</span></span></label>
                        <div class="gauge-work" id="workBlock">
                            <span class="history-search-label payday-label">⏱️ 근무 시간</span>
                            <div class="ledger-daterange" id="workTimeRow">
                                <input type="time" id="workStartTime" required>
                                <span class="hint">~</span>
                                <input type="time" id="workEndTime" required>
                            </div>
                            <div class="work-days-picker" id="workDaysPicker">
                                ${['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'].map((d, i) => `
                                    <label class="work-day-chip">
                                        <input type="checkbox" value="${d}">
                                        <span>${['월', '화', '수', '목', '금', '토', '일'][i]}</span>
                                    </label>
                                `).join('')}
                            </div>
                        </div>
                        <p class="hint payday-preview" id="gaugeKindHint"></p>

                        <button type="submit" class="btn btn-primary">저장</button>
                    </form>
                    <div id="workScheduleStatus" style="margin-top:8px; font-size:13px; color:var(--text-muted);"></div>
                </div>

                <div class="card" style="margin-top:20px;">
                    <h3>📲 카드 문자 자동 입력</h3>
                    <p class="subtitle" style="margin-top:6px;">카드 결제 문자를 받으면 내 가계부에 자동으로 넣어요. 아이폰은 '단축어', 안드로이드는 'MacroDroid' 앱에서 한 번만 설정하면 돼요.</p>
                    <div id="smsLinkArea" class="sms-link" style="margin-top:14px; max-width:520px;"><div class="hint">불러오는 중…</div></div>
                </div>
            </section>`;
        },

        async onMounted() {
            const $ = (id) => document.getElementById(id);

            function renderInfo() {
                const u = authStore.user;
                if (!u) return;
                $('myInfoArea').innerHTML = `
                    <div class="ledger-list-item" style="border-bottom:1px solid var(--border); padding-bottom:8px; margin-bottom:8px;">
                        <span class="ledger-list-item-category">아이디</span>
                        <span class="ledger-list-item-memo">${escapeHtml(u.username)}</span>
                    </div>
                    <div class="ledger-list-item" style="border-bottom:1px solid var(--border); padding-bottom:8px; margin-bottom:8px;">
                        <span class="ledger-list-item-category">이름</span>
                        <span class="ledger-list-item-memo">${escapeHtml(u.displayName)} <span class="hint">(나만 볼 수 있어요)</span></span>
                    </div>
                    <div class="mypage-nickname">
                        <label class="ledger-list-item-category" for="nicknameInput">닉네임</label>
                        <p class="hint" style="margin:2px 0 8px;">친구 목록·공유 캘린더 등 다른 사람에게는 닉네임이 보여요.${u.nickname ? '' : ' 아직 닉네임이 없어서 지금은 이름이 보이고 있어요.'}</p>
                        <div class="mypage-nickname-row">
                            <input type="text" id="nicknameInput" maxlength="12" placeholder="2~12자" value="${escapeHtml(u.nickname || '')}">
                            <button type="button" class="btn btn-primary" id="nicknameSaveBtn">저장</button>
                        </div>
                        <p class="auth-field-msg" id="nicknameMsg" aria-live="polite"></p>
                    </div>
                `;
                bindNickname();
            }

            /** 마이페이지 닉네임: 입력하면 사용 가능 여부 확인, [저장]으로 변경 */
            function bindNickname() {
                const input = $('nicknameInput');
                const msg = $('nicknameMsg');
                const show = (text, ok) => { msg.textContent = text; msg.className = `auth-field-msg ${ok ? 'is-ok' : 'is-error'}`; };
                let timer = null;
                input.addEventListener('input', () => {
                    clearTimeout(timer);
                    msg.textContent = '';
                    const value = input.value.trim();
                    if (!value || value === (authStore.user.nickname || '')) return;
                    timer = setTimeout(async () => {
                        try {
                            const { data } = await axios.get('/api/auth/nickname/available', { params: { nickname: value } });
                            if (input.value.trim() === value) show(data.message, data.available);
                        } catch { /* 저장 때 서버가 다시 검사 */ }
                    }, 350);
                });
                const save = async () => {
                    const value = input.value.trim();
                    if (value === (authStore.user.nickname || '')) return show('지금 쓰고 있는 닉네임이에요.', true);
                    const btn = $('nicknameSaveBtn');
                    btn.disabled = true;
                    try {
                        const { data } = await axios.put('/api/auth/nickname', { nickname: value });
                        authStore.setUser({ ...authStore.user, nickname: data.nickname });
                        renderUserPanel();      // 사이드바 'OO님'
                        renderSharedMenu();
                        renderInfo();
                        $('nicknameMsg').textContent = '닉네임을 저장했어요.';
                        $('nicknameMsg').className = 'auth-field-msg is-ok';
                    } catch (err) {
                        show(err.response?.data?.message || '닉네임을 저장하지 못했어요.', false);
                    } finally {
                        btn.disabled = false;
                    }
                };
                $('nicknameSaveBtn').onclick = save;
                input.addEventListener('keydown', (e) => {
                    if (e.key === 'Enter' && !e.isComposing) { e.preventDefault(); save(); }
                });
            }

            function renderAccountLink() {
                const linked = authStore.user && authStore.user.provider === 'KAKAO';
                $('accountLinkArea').innerHTML = linked
                    ? `<span class="hint">✅ 카카오 계정이 연결되어 있어요.</span>`
                    : `<a href="/api/auth/link/kakao" class="kakao-login-btn" style="max-width:260px; height:40px; font-size:14px;">💬 카카오 계정 연결하기</a>`;
            }

            /* ---------- ⏱️ 상단 게이지 설정 ---------- */
            let savedMode = '';           // 저장된 금액 방식 (자동 기록을 끌 때 물어보기 위해)
            let categoryTouched = false;  // 카테고리를 직접 고르면 근무 체크에 따라 자동으로 바꾸지 않음

            const modeValue = () => document.querySelector('input[name="salaryMode"]:checked')?.value || '';

            function readPayRule() {
                return {
                    payRule: $('payRule').value || null,
                    payDay: Number($('payDay').value),
                    payWeek: Number($('payWeek').value),
                    payWeekday: Number($('payWeekday').value),
                    payAdjust: $('payAdjust').value,
                };
            }

            function updatePaydayForm() {
                const rule = $('payRule').value;
                const mode = modeValue();
                $('payDayRow').hidden = rule !== 'DAY';
                $('payWeekRow').hidden = rule !== 'NTH_WEEKDAY';
                $('payAdjustRow').hidden = !rule;
                const r = readPayRule();
                const { start, end } = hasPayRule(r)
                    ? payPeriod(new Date(), r)
                    : (() => { const n = new Date(); return { start: new Date(n.getFullYear(), n.getMonth(), 1), end: new Date(n.getFullYear(), n.getMonth() + 1, 1) }; })();
                const lastDay = new Date(end.getFullYear(), end.getMonth(), end.getDate() - 1);
                $('paydayPreview').textContent = `다음 시작일 ${formatPayday(end)} · 지금 기간 ${start.getMonth() + 1}/${start.getDate()} ~ ${lastDay.getMonth() + 1}/${lastDay.getDate()}`;

                $('salaryAmount').hidden = !mode;
                $('salaryAmount').placeholder = mode === 'BUDGET' ? '한 달 예산 (예: 500,000)' : '매달 받는 금액 (예: 300,000)';
                $('autoRecordRow').hidden = mode !== 'FIXED';
                $('workGaugeRow').hidden = mode !== 'FIXED';
                // 근무 시간: 설정 안 함(예전 방식)이거나, 고정 금액 + '근무 시간에 따라 쌓이게' 체크일 때
                const work = mode === '' || (mode === 'FIXED' && $('workGauge').checked);
                $('workBlock').hidden = !work;
                if (mode === 'FIXED' && !categoryTouched) $('incomeCategory').value = $('workGauge').checked ? '월급' : '용돈';
                $('gaugeKindHint').textContent = work
                    ? '상단바: 근무 요일·시간에만 번 돈이 초 단위로 쌓여요.'
                    : '상단바: 남은 돈과 다음 시작일까지 하루에 쓸 수 있는 돈(D-day)을 보여줘요.';
            }

            ['payRule', 'payDay', 'payWeek', 'payWeekday', 'payAdjust', 'workGauge'].forEach(id => $(id).addEventListener('change', updatePaydayForm));
            $('incomeCategory').addEventListener('change', () => { categoryTouched = true; });
            document.querySelectorAll('input[name="salaryMode"]').forEach(r => r.addEventListener('change', () => {
                updatePaydayForm();
                if (r.checked && r.value) $('salaryAmount').focus();
            }));
            $('salaryAmount').addEventListener('input', () => {
                const digits = $('salaryAmount').value.replace(/[^0-9]/g, '');
                $('salaryAmount').value = digits ? Number(digits).toLocaleString('ko-KR') : '';
            });

            async function loadWorkSchedule() {
                const { data: d } = await axios.get('/api/auth/work-schedule');
                $('workStartTime').value = (d.workStartTime || '09:00:00').slice(0, 5);
                $('workEndTime').value = (d.workEndTime || '18:00:00').slice(0, 5);
                const days = (d.workDays || 'MON,TUE,WED,THU,FRI').split(',');
                $('workDaysPicker').querySelectorAll('input[type="checkbox"]').forEach(cb => { cb.checked = days.includes(cb.value); });
                $('payRule').value = d.payRule || '';
                if (d.payDay) $('payDay').value = String(d.payDay);
                if (d.payWeek) $('payWeek').value = String(d.payWeek);
                if (d.payWeekday != null) $('payWeekday').value = String(d.payWeekday);
                $('payAdjust').value = d.payAdjust || 'BEFORE';
                savedMode = ['FIXED', 'BUDGET'].includes(d.salaryMode) ? d.salaryMode : '';
                document.querySelector(`input[name="salaryMode"][value="${savedMode}"]`).checked = true;
                $('salaryAmount').value = d.salaryAmount ? Number(d.salaryAmount).toLocaleString('ko-KR') : '';
                $('workGauge').checked = d.incomeType !== 'BALANCE';
                if (d.incomeCategory) { $('incomeCategory').value = d.incomeCategory; categoryTouched = true; }
                updatePaydayForm();
            }

            /** 고정 금액과 같은 카테고리·금액 수입이 이미 있으면 알려줌 (예: 이미 '매달 반복'으로 넣어둔 월급) */
            async function checkDuplicate(category, amount) {
                $('dupNotice').hidden = true;
                try {
                    const to = new Date();
                    const from = new Date(to.getFullYear(), to.getMonth() - 2, 1);
                    const ymd = (x) => `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, '0')}-${String(x.getDate()).padStart(2, '0')}`;
                    const { data } = await axios.get('/api/money/ledger/range', { params: { from: ymd(from), to: ymd(new Date(to.getFullYear(), to.getMonth() + 1, 0)) } });
                    const same = (data || []).filter(tx => tx.type === 'INCOME' && tx.category === category && Number(tx.amount) === amount && tx.memo !== '자동 기록');
                    if (!same.length) return;
                    const recurring = same.some(tx => tx.recurring || tx.recurringOriginId);
                    const d = same[same.length - 1];
                    $('dupNotice').textContent = `⚠️ 이미 '${category} ${amount.toLocaleString('ko-KR')}원' 내역이 있어요 (${Number(d.date.slice(5, 7))}/${Number(d.date.slice(8))}${recurring ? ', 매달 반복' : ''}). `
                        + '자동 기록과 겹치면 같은 돈이 두 번 들어갈 수 있으니, 필요하면 하나를 정리해주세요.';
                    $('dupNotice').hidden = false;
                } catch { /* 확인 못 해도 저장에는 지장 없음 */ }
            }

            /** 고정 금액(자동 기록)을 끌 때: 이미 자동으로 들어간 내역을 남길지/지울지 사용자가 고름 */
            async function askAutoEntries() {
                let count = 0;
                try { ({ data: { count } } = await axios.get('/api/money/auto-income/entries/count')); } catch { return 'keep'; }
                if (!count) return 'keep';
                return new Promise((resolve) => {
                    let decided = false;
                    const modal = openModal({
                        title: '자동 기록을 끌게요',
                        bodyHtml: `<p class="history-modal-help">지금까지 가계부에 자동으로 들어간 수입 내역이 <b>${count}건</b> 있어요. 어떻게 할까요?</p>`,
                        actionsHtml: `
                            <button type="button" class="btn btn-ghost" data-pick="cancel">취소</button>
                            <button type="button" class="btn btn-danger" data-pick="delete">모두 지우기</button>
                            <button type="button" class="btn btn-primary" data-pick="keep">남겨두기</button>`,
                        onClose: () => { if (!decided) resolve('cancel'); },
                    });
                    modal.el.querySelectorAll('[data-pick]').forEach(btn => btn.addEventListener('click', () => {
                        decided = true;
                        resolve(btn.dataset.pick);
                        modal.close();
                    }));
                });
            }

            /* ---------- 📲 카드 문자 자동 입력 ---------- */
            const smsUrl = (key) => `${location.origin}/api/sms/in?key=${encodeURIComponent(key)}`;
            const fmtTime = (v) => {
                if (!v) return '아직 없음';
                const d = new Date(String(v).replace(' ', 'T'));
                return isNaN(d) ? String(v) : `${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
            };

            // 📲 설정 안내: 쓰는 휴대폰에 맞는 안내를 먼저 펼쳐서 보여줌
            //  - 아이폰 '단축어 설치' 링크가 준비되면 IOS_SHORTCUT_URL에 넣기 (iCloud 공유 링크, 설치할 때 전송 주소를 묻도록 만든 단축어)
            const IOS_SHORTCUT_URL = '';
            const ua = navigator.userAgent || '';
            const isIOS = /iPhone|iPad|iPod/i.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
            const isAndroid = /Android/i.test(ua);

            const IOS_GUIDE = (open) => `
                <details class="sms-guide"${open ? ' open' : ''}>
                    <summary>🍎 아이폰 자동 입력 설정 (iOS 17 이상)</summary>
                    ${IOS_SHORTCUT_URL ? `
                    <ol>
                        <li>위 <b>전송 주소를 복사</b>한 뒤 <a class="btn btn-primary btn-sm" href="${IOS_SHORTCUT_URL}" target="_blank" rel="noopener">📲 단축어 설치</a> → <b>[단축어 추가]</b> → 주소 붙여넣기</li>
                        <li>단축어 앱 → <b>[자동화]</b> → <b>[+]</b> → <b>[메시지]</b> → 메시지 포함 <b>승인</b> → <b>[즉시 실행]</b> → <b>[다음]</b></li>
                        <li><b>'GrowTive 카드 문자'</b> 단축어 선택 → <b>[완료]</b></li>
                    </ol>` : `
                    <ol>
                        <li><b>단축어</b> 앱 → <b>[자동화]</b> → <b>[+]</b> → <b>[메시지]</b> → 메시지 포함 <b>승인</b> → <b>[즉시 실행]</b> → <b>[다음]</b> → <b>[새로운 빈 단축어]</b></li>
                        <li><b>[URL 내용 가져오기]</b> 추가 → URL에 위 <b>전송 주소</b> 붙여넣기</li>
                        <li>▶ 펼치기 → 방법 <b>POST</b> → 요청 본문 <b>JSON</b> → 필드 <b>텍스트</b>: 키 <b>text</b>, 값 <b>[단축어 입력]</b> → <b>[완료]</b></li>
                    </ol>`}
                    <p class="hint sms-note">아이폰은 카드사 <b>문자(SMS)</b>만 읽을 수 있어요. 카드사 앱 알림·카카오톡 알림톡을 쓰고 있다면 문자 알림으로 바꿔주세요.</p>
                </details>`;

            const ANDROID_GUIDE = (open) => `
                <details class="sms-guide"${open ? ' open' : ''}>
                    <summary>🤖 안드로이드 설정</summary>
                    <p class="sms-guide-lead"><b>① 설정 없이 바로</b> — 홈 화면에 GrowTive 앱을 설치했다면, 카드 문자를 길게 눌러 <b>[공유] → GrowTive</b>만 누르면 확인 대기함으로 들어와요.</p>
                    <p class="sms-guide-lead"><b>② 완전 자동</b> — <b>MacroDroid</b> 앱(무료)으로 한 번만 설정</p>
                    <ol>
                        <li>MacroDroid 설치 → <b>[매크로 추가]</b></li>
                        <li>트리거: <b>[알림] → [알림 수신]</b> → 앱: <b>메시지 앱</b> → 내용 포함 <b>승인</b> (알림 접근 허용)</li>
                        <li>동작: <b>[웹 상호작용] → [HTTP 요청]</b> → <b>POST</b> → URL에 위 <b>전송 주소</b> 붙여넣기 → 본문 <b>text/plain</b>, 내용은 마법 텍스트 <b>[알림 텍스트]</b> → 저장</li>
                    </ol>
                    <p class="hint sms-note">• 2번에서 앱만 카드사 앱·카카오톡으로 바꿔 하나 더 만들면 앱 알림·알림톡도 받을 수 있어요.<br>• 설정 › 배터리에서 MacroDroid를 '제한 없음'으로 두면 화면이 꺼져 있어도 놓치지 않아요.</p>
                </details>`;

            const SMS_GUIDE_HTML = () => {
                const mine = isIOS ? IOS_GUIDE(true) : isAndroid ? ANDROID_GUIDE(true) : IOS_GUIDE(false) + ANDROID_GUIDE(false);
                const other = isIOS ? ANDROID_GUIDE(false) : isAndroid ? IOS_GUIDE(false) : '';
                return `${mine}${other ? `<details class="sms-guide sms-guide--other"><summary>다른 휴대폰 안내</summary>${other}</details>` : ''}
                    <p class="hint sms-note">서버가 쉬고 있으면 첫 문자가 늦게 들어가거나 빠질 수 있어요. 빠진 건 캘린더의 [📋 카드 문자 붙여넣기]로 넣을 수 있어요.</p>`;
            };

            async function renderSmsLink(freshKey = null) {
                let info;
                try { ({ data: info } = await axios.get('/api/sms/link')); } catch { $('smsLinkArea').innerHTML = '<div class="hint">불러오지 못했어요.</div>'; return; }
                if (!info.exists) {
                    $('smsLinkArea').innerHTML = `
                        <button type="button" class="btn btn-primary" id="smsCreateBtn">🔑 내 전송 주소 만들기</button>
                        ${SMS_GUIDE_HTML()}`;
                    $('smsCreateBtn').onclick = () => createKey(false);
                    return;
                }
                $('smsLinkArea').innerHTML = `
                    ${freshKey ? `
                        <div class="sms-key-box">
                            <label class="history-search-label payday-label">내 전송 주소 <span class="hint">— 지금 한 번만 보여요. 다른 사람에게 알려주지 마세요.</span></label>
                            <div class="sms-key-row">
                                <input type="text" id="smsUrl" readonly value="${escapeHtml(smsUrl(freshKey))}">
                                <button type="button" class="btn btn-primary btn-sm" id="smsCopyBtn">복사</button>
                            </div>
                        </div>` : ''}
                    <div class="sms-status">✅ 연결됨 <span class="hint">· 주소 만든 때 ${fmtTime(info.createdAt)} · 마지막으로 받은 때 ${fmtTime(info.lastUsedAt)}</span></div>
                    <span class="history-search-label payday-label">받은 문자를</span>
                    <label class="payday-radio"><input type="radio" name="smsMode" value="review"${info.autoSave ? '' : ' checked'}> <span>확인 후 저장 <span class="hint">— 캘린더의 📩 확인 대기함에서 확인</span></span></label>
                    <label class="payday-radio"><input type="radio" name="smsMode" value="auto"${info.autoSave ? ' checked' : ''}> <span>바로 가계부에 저장 <span class="hint">— 승인취소는 항상 확인 대기</span></span></label>
                    <div class="sms-actions">
                        <button type="button" class="btn btn-ghost btn-sm" id="smsRecreateBtn">주소 다시 만들기</button>
                        <button type="button" class="btn btn-danger btn-sm" id="smsUnlinkBtn">연결 끊기</button>
                    </div>
                    ${SMS_GUIDE_HTML()}`;
                $('smsCopyBtn')?.addEventListener('click', async () => {
                    try { await navigator.clipboard.writeText($('smsUrl').value); $('smsCopyBtn').textContent = '복사됨'; }
                    catch { $('smsUrl').select(); document.execCommand?.('copy'); $('smsCopyBtn').textContent = '복사됨'; }
                });
                document.querySelectorAll('input[name="smsMode"]').forEach(r => r.addEventListener('change', async () => {
                    try { await axios.put('/api/sms/link/settings', { autoSave: r.value === 'auto' }); }
                    catch (err) { alert(err.response?.data?.message || '저장하지 못했어요.'); }
                }));
                $('smsRecreateBtn').onclick = () => createKey(true);
                $('smsUnlinkBtn').onclick = async () => {
                    if (!confirm('연결을 끊을까요? 지금 주소로는 더 이상 문자가 들어오지 않아요. (이미 받은 문자와 가계부 내역은 그대로예요)')) return;
                    await axios.delete('/api/sms/link');
                    renderSmsLink();
                };
            }

            async function createKey(again) {
                if (again && !confirm('새 주소를 만들까요? 예전 주소는 바로 막혀서, 단축어/MacroDroid에 새 주소를 다시 넣어야 해요.')) return;
                try {
                    const { data } = await axios.post('/api/sms/link');
                    await renderSmsLink(data.key);
                } catch (err) { alert(err.response?.data?.message || '주소를 만들지 못했어요.'); }
            }

            $('workScheduleForm').addEventListener('submit', async (e) => {
                e.preventDefault();
                const mode = modeValue();
                const work = mode === '' || (mode === 'FIXED' && $('workGauge').checked);
                const workDays = [...$('workDaysPicker').querySelectorAll('input[type="checkbox"]:checked')]
                    .map(cb => cb.value).join(',');
                if (work && !workDays) {
                    alert('근무 요일을 최소 하루는 선택해주세요.');
                    return;
                }
                const salaryAmount = Number($('salaryAmount').value.replace(/[^0-9]/g, '')) || null;
                if (mode && !salaryAmount) {
                    alert(mode === 'BUDGET' ? '한 달 예산을 입력해주세요.' : '매달 받는 금액을 입력해주세요.');
                    $('salaryAmount').focus();
                    return;
                }
                let pick = 'keep';
                if (savedMode === 'FIXED' && mode !== 'FIXED') {
                    pick = await askAutoEntries();
                    if (pick === 'cancel') return;
                }
                try {
                    await axios.put('/api/auth/work-schedule', {
                        workStartTime: $('workStartTime').value,
                        workEndTime: $('workEndTime').value,
                        workDays: workDays || 'MON,TUE,WED,THU,FRI',
                        ...readPayRule(),
                        salaryMode: mode || null,
                        salaryAmount: mode ? salaryAmount : null,
                        incomeType: work ? 'SALARY' : 'BALANCE',
                        incomeCategory: $('incomeCategory').value,
                    });
                    if (pick === 'delete') await axios.delete('/api/money/auto-income/entries');
                    savedMode = mode;
                    $('workScheduleStatus').textContent = pick === 'delete' ? '저장했고, 자동 기록된 내역을 지웠어요.' : '저장했습니다.';
                    if (mode === 'FIXED') await checkDuplicate($('incomeCategory').value, salaryAmount);
                    initTopbarSalaryTicker(); // 상단 게이지에 바로 반영 (고정 금액이면 이번 기간 자동 기록도)
                } catch (err) {
                    alert(err.response?.data?.message || '저장에 실패했습니다.');
                }
            });

            renderInfo();
            renderAccountLink();
            await loadWorkSchedule();
            await renderSmsLink();

            const hashParams = new URLSearchParams(location.hash.split('?')[1] || '');
            if (hashParams.get('linked') === '1') {
                await authStore.load();
                renderInfo();
                renderAccountLink();
                alert('카카오 계정이 연결되었습니다.');
            } else if (hashParams.get('linkError')) {
                alert(decodeURIComponent(hashParams.get('linkError')));
            }
        }
    };
}
