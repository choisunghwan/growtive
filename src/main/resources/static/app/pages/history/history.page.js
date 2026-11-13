/**
 * 🧾 재무 대시보드 > 내역
 * 한 달 동안 가계부에 입력한 내역을 달력 없이 날짜별로 한데 모아 보여준다.
 * - 상단: ◀ YYYY년 M월 ▶ (가계부 캘린더와 동일) + 이번 달 수입/지출 요약
 * - 본문: 날짜별 그룹(최근 날짜가 위) → 그날 합계 + 그날 내역 목록
 * - 수정: 가계부 캘린더의 해당 날짜로 이동해서 수정 폼을 바로 열어줌
 * - 삭제: 이 화면에서 바로 삭제
 * 일정(schedule)은 보여주지 않는다. 데이터는 캘린더와 같은 /api/money/ledger 를 사용.
 */

import { categoryIcon } from '../ledger/ledger.page.js';
import { initTopbarSalaryTicker } from '../../ui/salary-ticker.js';

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'];

function won(n) { return `${Number(n || 0).toLocaleString('ko-KR')}원`; }

function escapeHtml(s) {
    return String(s ?? '').replace(/[&<>"']/g, c => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[c]));
}

function sumOf(list) {
    let income = 0, expense = 0;
    for (const tx of list) {
        if (tx.type === 'INCOME') income += Number(tx.amount);
        else expense += Number(tx.amount);
    }
    return { income, expense };
}

function totalsChipsHtml({ income, expense }) {
    const net = income - expense;
    return `
        ${income ? `<span class="ledger-day-chip is-income">수입 +${won(income)}</span>` : ''}
        ${expense ? `<span class="ledger-day-chip is-expense">지출 -${won(expense)}</span>` : ''}
        <span class="ledger-day-chip ledger-day-net ${net >= 0 ? 'is-income' : 'is-expense'}">합계 ${net >= 0 ? '+' : '-'}${won(Math.abs(net))}</span>`;
}

export default function HistoryPage() {
    const now = new Date();
    const state = {
        year: now.getFullYear(),
        month: now.getMonth() + 1,
        transactions: [],
    };

    async function loadMonth() {
        const { data } = await axios.get('/api/money/ledger', {
            params: { year: state.year, month: state.month }
        });
        state.transactions = data || [];
    }

    function summaryHtml() {
        const { income, expense } = sumOf(state.transactions);
        const net = income - expense;
        return `
            <div>이번 달 수입 <b class="is-income">${won(income)}</b></div>
            <div>이번 달 지출 <b class="is-expense">${won(expense)}</b></div>
            <div>합계 <b class="${net >= 0 ? 'is-income' : 'is-expense'}">${net >= 0 ? '+' : '-'}${won(Math.abs(net))}</b></div>`;
    }

    function txItemHtml(tx) {
        const isRecurringRelated = tx.recurring || tx.recurringOriginId;
        return `
            <li class="ledger-tx-item">
                <div class="ledger-tx-main">
                    <span class="ledger-tx-category">${categoryIcon(tx.category)} ${escapeHtml(tx.category)}${isRecurringRelated ? ' <span class="ledger-tx-recurring-badge" title="매달 반복">🔁</span>' : ''}${tx.hidden ? ' <span class="ledger-tx-recurring-badge" title="친구에게 숨김">🙈</span>' : ''}</span>
                    <span class="ledger-tx-amount ${tx.type === 'INCOME' ? 'is-income' : 'is-expense'}">
                        ${tx.type === 'INCOME' ? '+' : '-'}${won(tx.amount)}
                    </span>
                </div>
                <div class="ledger-tx-sub">
                    <span class="ledger-tx-memo">${tx.memo ? escapeHtml(tx.memo) : ''}</span>
                    <span class="ledger-tx-actions">
                        <a class="btn btn-xs" href="#/calendar?date=${tx.date}&edit=${tx.id}">수정</a>
                        <button type="button" class="btn btn-xs btn-danger" data-del="${tx.id}">삭제</button>
                    </span>
                </div>
            </li>`;
    }

    function listHtml() {
        if (state.transactions.length === 0) {
            return `<div class="hint">${state.month}월에 등록된 내역이 없습니다.</div>`;
        }

        const byDate = {};
        for (const tx of state.transactions) (byDate[tx.date] ||= []).push(tx);
        const dates = Object.keys(byDate).sort().reverse(); // 최근 날짜가 위로

        return dates.map(dateStr => {
            const list = byDate[dateStr];
            const d = new Date(dateStr + 'T00:00:00');
            const dow = d.getDay();
            const dowClass = dow === 0 ? ' is-sunday' : dow === 6 ? ' is-saturday' : '';
            return `
                <section class="history-day">
                    <div class="ledger-day-header history-day-header">
                        <h3 class="history-day-title${dowClass}">${d.getMonth() + 1}월 ${d.getDate()}일 <span>(${WEEKDAYS[dow]})</span></h3>
                        <div class="ledger-day-totals">${totalsChipsHtml(sumOf(list))}</div>
                    </div>
                    <ul class="ledger-tx-list">${list.map(txItemHtml).join('')}</ul>
                </section>`;
        }).join('');
    }

    return {
        title: '내역',

        render() {
            return `
            <section class="ledger-page history-page">
                <div class="card">
                    <div class="ledger-header history-header">
                        <div class="ledger-month-nav">
                            <button id="prevMonth" class="ledger-nav-btn" type="button" aria-label="이전 달">◀</button>
                            <h2 id="monthLabel">${state.year}년 ${state.month}월</h2>
                            <button id="nextMonth" class="ledger-nav-btn" type="button" aria-label="다음 달">▶</button>
                        </div>
                    </div>
                    <div class="ledger-summary" id="monthSummary"></div>
                </div>

                <div class="card">
                    <div id="historyList"><div class="hint">불러오는 중…</div></div>
                </div>
            </section>`;
        },

        async onMounted() {
            const $ = (id) => document.getElementById(id);

            async function refresh() {
                $('monthLabel').textContent = `${state.year}년 ${state.month}월`;
                try {
                    await loadMonth();
                } catch (err) {
                    console.error(err);
                    $('historyList').innerHTML = `<div class="hint">내역을 불러오지 못했어요. 잠시 후 다시 시도해주세요.</div>`;
                    return;
                }
                $('monthSummary').innerHTML = summaryHtml();
                $('historyList').innerHTML = listHtml();
            }

            $('prevMonth').addEventListener('click', () => {
                state.month--;
                if (state.month < 1) { state.month = 12; state.year--; }
                refresh();
            });

            $('nextMonth').addEventListener('click', () => {
                state.month++;
                if (state.month > 12) { state.month = 1; state.year++; }
                refresh();
            });

            $('historyList').addEventListener('click', async (e) => {
                const btn = e.target.closest('button[data-del]');
                if (!btn) return;
                const tx = state.transactions.find(t => t.id === Number(btn.dataset.del));
                if (!tx) return;
                if (!confirm(`${tx.date} ${tx.category} ${won(tx.amount)} 내역을 삭제할까요?`)) return;
                btn.disabled = true;
                try {
                    await axios.delete(`/api/money/ledger/${tx.id}`);
                } catch (err) {
                    console.error(err);
                    alert('삭제하지 못했어요. 잠시 후 다시 시도해주세요.');
                    btn.disabled = false;
                    return;
                }
                await refresh();
                initTopbarSalaryTicker();
            });

            await refresh();
        }
    };
}
