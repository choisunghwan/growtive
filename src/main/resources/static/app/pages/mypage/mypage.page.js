import authStore from '../../store/authStore.js';
import { escapeHtml } from '../../ui/modal.js';
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
                    <h3>⏱️ 근무 시간 설정</h3>
                    <p class="subtitle" style="margin-top:6px;">상단 실시간 급여 게이지가 이 설정에 맞춰 움직여요. 근무하지 않는 요일/시간에는 멈춰 있고, 월급날을 정하면 월급날마다 0부터 다시 시작해요.</p>
                    <form id="workScheduleForm" class="form" style="margin-top:14px; max-width:420px;">
                        <div class="ledger-daterange">
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

                        <div class="payday-setting">
                            <label class="history-search-label" for="payRule">💰 월급날</label>
                            <select id="payRule">
                                <option value="">설정 안 함 (매달 1일~말일 기준)</option>
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
                                    <option value="BEFORE">전 평일에 받아요</option>
                                    <option value="AFTER">다음 평일에 받아요</option>
                                    <option value="KEEP">그날 그대로</option>
                                </select>
                            </div>
                            <p class="hint payday-preview" id="paydayPreview"></p>

                            <span class="history-search-label">💵 월급 금액</span>
                            <label class="payday-radio"><input type="radio" name="salaryMode" value="LEDGER" checked>
                                가계부의 '월급' 내역 금액 (매달 다를 때)</label>
                            <label class="payday-radio"><input type="radio" name="salaryMode" value="FIXED">
                                고정 금액</label>
                            <input type="text" id="salaryAmount" inputmode="numeric" placeholder="예: 3,000,000" hidden>
                        </div>

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

            /* ---------- 💰 월급날 / 월급 금액 ---------- */
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
                $('payDayRow').hidden = rule !== 'DAY';
                $('payWeekRow').hidden = rule !== 'NTH_WEEKDAY';
                $('payAdjustRow').hidden = !rule;
                const r = readPayRule();
                if (hasPayRule(r)) {
                    const { start, end } = payPeriod(new Date(), r);
                    const lastDay = new Date(end.getFullYear(), end.getMonth(), end.getDate() - 1);
                    $('paydayPreview').textContent = `다음 월급날 ${formatPayday(end)} · 지금 게이지 기간 ${start.getMonth() + 1}/${start.getDate()} ~ ${lastDay.getMonth() + 1}/${lastDay.getDate()}`;
                } else {
                    $('paydayPreview').textContent = '상단 게이지가 매달 1일에 0부터 다시 시작해요.';
                }
                const fixed = document.querySelector('input[name="salaryMode"]:checked')?.value === 'FIXED';
                $('salaryAmount').hidden = !fixed;
            }

            ['payRule', 'payDay', 'payWeek', 'payWeekday', 'payAdjust'].forEach(id => $(id).addEventListener('change', updatePaydayForm));
            document.querySelectorAll('input[name="salaryMode"]').forEach(r => r.addEventListener('change', () => {
                updatePaydayForm();
                if (r.value === 'FIXED' && r.checked) $('salaryAmount').focus();
            }));
            $('salaryAmount').addEventListener('input', () => {
                const digits = $('salaryAmount').value.replace(/[^0-9]/g, '');
                $('salaryAmount').value = digits ? Number(digits).toLocaleString('ko-KR') : '';
            });

            async function loadWorkSchedule() {
                const res = await axios.get('/api/auth/work-schedule');
                const { workStartTime, workEndTime, workDays } = res.data;
                const d = res.data;
                $('payRule').value = d.payRule || '';
                if (d.payDay) $('payDay').value = String(d.payDay);
                if (d.payWeek) $('payWeek').value = String(d.payWeek);
                if (d.payWeekday != null) $('payWeekday').value = String(d.payWeekday);
                $('payAdjust').value = d.payAdjust || 'BEFORE';
                const mode = d.salaryMode === 'FIXED' ? 'FIXED' : 'LEDGER';
                document.querySelector(`input[name="salaryMode"][value="${mode}"]`).checked = true;
                $('salaryAmount').value = d.salaryAmount ? Number(d.salaryAmount).toLocaleString('ko-KR') : '';
                updatePaydayForm();
                $('workStartTime').value = (workStartTime || '09:00:00').slice(0, 5);
                $('workEndTime').value = (workEndTime || '18:00:00').slice(0, 5);
                const days = (workDays || 'MON,TUE,WED,THU,FRI').split(',');
                $('workDaysPicker').querySelectorAll('input[type="checkbox"]').forEach(cb => {
                    cb.checked = days.includes(cb.value);
                });
            }

            $('workScheduleForm').addEventListener('submit', async (e) => {
                e.preventDefault();
                const workDays = [...$('workDaysPicker').querySelectorAll('input[type="checkbox"]:checked')]
                    .map(cb => cb.value).join(',');
                if (!workDays) {
                    alert('근무 요일을 최소 하루는 선택해주세요.');
                    return;
                }
                const salaryMode = document.querySelector('input[name="salaryMode"]:checked')?.value || 'LEDGER';
                const salaryAmount = Number($('salaryAmount').value.replace(/[^0-9]/g, '')) || null;
                if (salaryMode === 'FIXED' && !salaryAmount) {
                    alert('고정 월급 금액을 입력해주세요.');
                    $('salaryAmount').focus();
                    return;
                }
                try {
                    await axios.put('/api/auth/work-schedule', {
                        workStartTime: $('workStartTime').value,
                        workEndTime: $('workEndTime').value,
                        workDays,
                        ...readPayRule(),
                        salaryMode,
                        salaryAmount: salaryMode === 'FIXED' ? salaryAmount : null,
                    });
                    $('workScheduleStatus').textContent = '저장했습니다.';
                    initTopbarSalaryTicker(); // 상단 게이지에 바로 반영
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
