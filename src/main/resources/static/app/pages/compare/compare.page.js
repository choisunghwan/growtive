// 친구가 입력한 글자는 반드시 이스케이프해서 표시 (스크립트 삽입 방지)
import { escapeHtml as esc } from '../../ui/modal.js';
const COLOR_TAGS = {
    blue: '#2563eb', indigo: '#4f46e5', purple: '#7c3aed', pink: '#db2777',
    red: '#dc2626', orange: '#f59e0b', yellow: '#ca8a04', green: '#16a34a',
    teal: '#0d9488', gray: '#64748b'
};
function colorTagHex(key) { return COLOR_TAGS[key] || COLOR_TAGS.blue; }

function pad2(n) { return String(n).padStart(2, '0'); }
function ymd(y, m, d) { return `${y}-${pad2(m)}-${pad2(d)}`; }
function won(n) { return `${Number(n || 0).toLocaleString('ko-KR')}원`; }

function calendarCells(year, month) {
    const first = new Date(year, month - 1, 1);
    const startWeekday = first.getDay();
    const daysInMonth = new Date(year, month, 0).getDate();
    const cells = [];
    for (let i = 0; i < startWeekday; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) cells.push(d);
    return cells;
}

function weekdayHeaderHtml() {
    return ['일', '월', '화', '수', '목', '금', '토'].map((w, i) => {
        const cls = i === 0 ? ' cmp-weekday--sunday' : (i === 6 ? ' cmp-weekday--saturday' : '');
        return `<div class="cmp-weekday${cls}">${w}</div>`;
    }).join('');
}

function renderMoneyMiniCalendar(year, month, transactions, selectedDate) {
    const byDate = {};
    transactions.forEach(tx => { (byDate[tx.date] ||= []).push(tx); });

    const cells = calendarCells(year, month).map((day, idx) => {
        if (day === null) return `<div class="cmp-cell cmp-cell--empty"></div>`;
        const dateStr = ymd(year, month, day);
        const list = byDate[dateStr] || [];
        let income = 0, expense = 0;
        list.forEach(tx => { if (tx.type === 'INCOME') income += Number(tx.amount); else expense += Number(tx.amount); });
        const weekday = idx % 7;
        let cls = weekday === 0 ? ' cmp-cell--sunday' : (weekday === 6 ? ' cmp-cell--saturday' : '');
        if (dateStr === selectedDate) cls += ' cmp-cell--selected';
        return `
            <div class="cmp-cell${cls}" data-date="${dateStr}">
                <div class="cmp-cell-day">${day}</div>
                ${expense > 0 ? `<div class="cmp-cell-expense">-${won(expense)}</div>` : ''}
                ${income > 0 ? `<div class="cmp-cell-income">+${won(income)}</div>` : ''}
            </div>`;
    }).join('');

    return weekdayHeaderHtml() + cells;
}

function renderScheduleMiniCalendar(year, month, events, selectedDate) {
    const byDate = {};
    events.forEach(ev => {
        const cur = new Date(ev.startDate + 'T00:00:00');
        const end = new Date(ev.endDate + 'T00:00:00');
        while (cur <= end) {
            const key = ymd(cur.getFullYear(), cur.getMonth() + 1, cur.getDate());
            (byDate[key] ||= []).push(ev);
            cur.setDate(cur.getDate() + 1);
        }
    });

    const MAX_TITLES = 2;
    const cells = calendarCells(year, month).map((day, idx) => {
        if (day === null) return `<div class="cmp-cell cmp-cell--empty"></div>`;
        const dateStr = ymd(year, month, day);
        const list = byDate[dateStr] || [];
        const weekday = idx % 7;
        let cls = weekday === 0 ? ' cmp-cell--sunday' : (weekday === 6 ? ' cmp-cell--saturday' : '');
        if (dateStr === selectedDate) cls += ' cmp-cell--selected';
        const titles = list.slice(0, MAX_TITLES).map(ev => `
            <div class="cmp-event-title">
                <span class="ledger-event-dot" style="background:${colorTagHex(ev.colorTag)}"></span>${esc(ev.title)}
            </div>`).join('');
        const overflow = list.length > MAX_TITLES ? `<div class="cmp-event-more">+${list.length - MAX_TITLES}건 더</div>` : '';
        return `
            <div class="cmp-cell${cls}" data-date="${dateStr}">
                <div class="cmp-cell-day">${day}</div>
                ${titles}${overflow}</div>`;
    }).join('');

    return weekdayHeaderHtml() + cells;
}

function txListHtml(list) {
    if (!list.length) return `<div class="hint">내역이 없습니다.</div>`;
    return `<ul class="ledger-tx-list">${list.map(tx => `
        <li class="ledger-tx-item">
            <div class="ledger-tx-main">
                <span class="ledger-tx-category">${esc(tx.category)}</span>
                <span class="ledger-tx-amount ${tx.type === 'INCOME' ? 'is-income' : 'is-expense'}">${tx.type === 'INCOME' ? '+' : '-'}${won(tx.amount)}</span>
            </div>
            ${tx.memo ? `<div class="ledger-tx-sub"><span class="ledger-tx-memo">${esc(tx.memo)}</span></div>` : ''}
        </li>`).join('')}</ul>`;
}

function eventListHtml(list) {
    if (!list.length) return `<div class="hint">일정이 없습니다.</div>`;
    return `<ul class="ledger-tx-list">${list.map(ev => `
        <li class="ledger-tx-item">
            <div class="ledger-tx-main">
                <span class="ledger-tx-category"><span class="ledger-event-dot" style="background:${colorTagHex(ev.colorTag)}"></span> ${esc(ev.title)}</span>
                ${ev.time ? `<span class="ledger-event-time">${ev.time.slice(0, 5)}</span>` : ''}
            </div>
            ${ev.memo ? `<div class="ledger-tx-sub"><span class="ledger-tx-memo">${esc(ev.memo)}</span></div>` : ''}
        </li>`).join('')}</ul>`;
}

export default function ComparePage() {
    return {
        title: '캘린더 비교',

        render() {
            return `
            <section class="compare-page">
                <div class="card">
                    <div class="ledger-header">
                        <div class="ledger-month-nav">
                            <button id="cmpPrevMonth" class="ledger-nav-btn" type="button">◀</button>
                            <h2 id="cmpMonthLabel"></h2>
                            <button id="cmpNextMonth" class="ledger-nav-btn" type="button">▶</button>
                        </div>
                        <div class="ledger-switch" id="cmpModeSwitch">
                            <button type="button" class="ledger-switch-btn is-active" data-mode="money">💰 가계부</button>
                            <button type="button" class="ledger-switch-btn" data-mode="schedule">📆 일정</button>
                        </div>
                    </div>
                    <div id="cmpSummary" style="margin-top:12px;"></div>
                </div>

                <div class="compare-columns" style="margin-top:20px;">
                    <div class="card compare-col">
                        <h3 id="myColTitle">나</h3>
                        <div id="myCalendar" class="ledger-grid"></div>
                    </div>
                    <div class="card compare-col">
                        <h3 id="friendColTitle">친구</h3>
                        <div id="friendCalendar" class="ledger-grid"></div>
                    </div>
                </div>

                <div class="card" style="margin-top:20px;">
                    <h3 id="cmpDayTitle">날짜를 클릭하면 상세 내역이 보여요</h3>
                    <div class="compare-columns" style="margin-top:12px;">
                        <div class="compare-col">
                            <h4 class="hint" style="margin:0 0 8px;">나</h4>
                            <div id="cmpMyDayDetail"></div>
                        </div>
                        <div class="compare-col">
                            <h4 class="hint" id="cmpFriendDayDetailTitle" style="margin:0 0 8px;">친구</h4>
                            <div id="cmpFriendDayDetail"></div>
                        </div>
                    </div>
                </div>
            </section>`;
        },

        async onMounted() {
            const $ = (id) => document.getElementById(id);
            const params = new URLSearchParams(location.hash.split('?')[1] || '');
            const connectionId = params.get('id');

            if (!connectionId) {
                document.querySelector('.compare-page').innerHTML = `
                    <div class="card">
                        <h2>잘못된 접근입니다</h2>
                        <p class="hint">친구 목록에서 "캘린더 비교" 버튼으로 들어와주세요.</p>
                    </div>`;
                return;
            }

            const now = new Date();
            let year = now.getFullYear();
            let month = now.getMonth() + 1;
            let mode = 'money';
            let selectedDate = null;
            let myTransactions = [], myEvents = [], friendData = null;

            function bindDayClicks() {
                document.querySelectorAll('#myCalendar .cmp-cell[data-date], #friendCalendar .cmp-cell[data-date]').forEach(cell => {
                    cell.addEventListener('click', () => {
                        selectedDate = cell.dataset.date;
                        renderCalendars();
                        renderDayDetail();
                    });
                });
            }

            function renderCalendars() {
                if (mode === 'money') {
                    $('myCalendar').innerHTML = renderMoneyMiniCalendar(year, month, myTransactions, selectedDate);
                    $('friendCalendar').innerHTML = renderMoneyMiniCalendar(year, month, friendData.transactions, selectedDate);
                } else {
                    $('myCalendar').innerHTML = renderScheduleMiniCalendar(year, month, myEvents, selectedDate);
                    $('friendCalendar').innerHTML = renderScheduleMiniCalendar(year, month, friendData.events, selectedDate);
                }
                bindDayClicks();
            }

            function renderDayDetail() {
                $('cmpFriendDayDetailTitle').textContent = friendData.friendDisplayName;

                if (!selectedDate) {
                    $('cmpDayTitle').textContent = '날짜를 클릭하면 상세 내역이 보여요';
                    $('cmpMyDayDetail').innerHTML = '';
                    $('cmpFriendDayDetail').innerHTML = '';
                    return;
                }

                $('cmpDayTitle').textContent = selectedDate;

                if (mode === 'money') {
                    $('cmpMyDayDetail').innerHTML = txListHtml(myTransactions.filter(t => t.date === selectedDate));
                    $('cmpFriendDayDetail').innerHTML = txListHtml(friendData.transactions.filter(t => t.date === selectedDate));
                } else {
                    const myList = myEvents.filter(ev => ev.startDate <= selectedDate && selectedDate <= ev.endDate);
                    const friendList = friendData.events.filter(ev => ev.startDate <= selectedDate && selectedDate <= ev.endDate);
                    $('cmpMyDayDetail').innerHTML = eventListHtml(myList);
                    $('cmpFriendDayDetail').innerHTML = eventListHtml(friendList);
                }
            }

            async function refresh() {
                $('cmpMonthLabel').textContent = `${year}년 ${month}월`;
                selectedDate = null;

                try {
                    const [myTxRes, myEvRes, friendRes] = await Promise.all([
                        axios.get('/api/money/ledger', { params: { year, month } }),
                        axios.get('/api/schedule', { params: { year, month } }),
                        axios.get(`/api/friends/${connectionId}/calendar`, { params: { year, month } })
                    ]);
                    myTransactions = myTxRes.data;
                    myEvents = myEvRes.data;
                    friendData = friendRes.data;
                } catch (e) {
                    document.querySelector('.compare-page').innerHTML = `
                        <div class="card">
                            <h2>비교할 수 없습니다</h2>
                            <p class="hint">${e.response?.data?.message || '오류가 발생했습니다.'}</p>
                        </div>`;
                    return;
                }

                $('friendColTitle').textContent = friendData.friendDisplayName;
                renderCalendars();
                renderDayDetail();
                refreshSummaryOnly();
            }

            function refreshSummaryOnly() {
                if (mode === 'money') {
                    const myIncome = myTransactions.filter(t => t.type === 'INCOME').reduce((s, t) => s + Number(t.amount), 0);
                    const myExpense = myTransactions.filter(t => t.type === 'EXPENSE').reduce((s, t) => s + Number(t.amount), 0);
                    const diff = myExpense - friendData.totalExpense;

                    let compareLine;
                    if (diff === 0) compareLine = '이번 달 지출이 똑같아요!';
                    else if (diff > 0) compareLine = `이번 달은 내가 ${won(diff)} 더 썼어요.`;
                    else compareLine = `이번 달은 ${friendData.friendDisplayName}님이 ${won(-diff)} 더 썼어요.`;

                    $('cmpSummary').innerHTML = `
                        <div class="compare-summary">
                            <div>나: 수입 <b class="is-income">${won(myIncome)}</b> · 지출 <b class="is-expense">${won(myExpense)}</b></div>
                            <div>${friendData.friendDisplayName}: 수입 <b class="is-income">${won(friendData.totalIncome)}</b> · 지출 <b class="is-expense">${won(friendData.totalExpense)}</b></div>
                            <div class="compare-callout">${compareLine}</div>
                        </div>`;
                } else {
                    $('cmpSummary').innerHTML = `
                        <div class="compare-summary">
                            <div>나: 이번 달 일정 ${myEvents.length}건</div>
                            <div>${friendData.friendDisplayName}: 이번 달 일정 ${friendData.events.length}건</div>
                        </div>`;
                }
            }

            $('cmpPrevMonth').addEventListener('click', () => {
                month--;
                if (month < 1) { month = 12; year--; }
                refresh();
            });

            $('cmpNextMonth').addEventListener('click', () => {
                month++;
                if (month > 12) { month = 1; year++; }
                refresh();
            });

            $('cmpModeSwitch').querySelectorAll('button[data-mode]').forEach(btn => {
                btn.addEventListener('click', () => {
                    mode = btn.dataset.mode;
                    $('cmpModeSwitch').querySelectorAll('button').forEach(b => b.classList.toggle('is-active', b === btn));
                    selectedDate = null;
                    renderCalendars();
                    renderDayDetail();
                    refreshSummaryOnly();
                });
            });

            await refresh();
        }
    };
}
