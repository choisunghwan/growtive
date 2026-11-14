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
