// resources/static/app/ui/salary-ticker.js
// 상단바에 항상 떠 있는 실시간 급여 카운터.
// 월급(마이페이지 고정 금액 또는 가계부 "월급" 내역)과 근무 스케줄·월급날 설정을 기반으로
// 근무 요일/시간에만 초 단위로 금액이 올라간다.

import authStore from '../store/authStore.js';
import { hasPayRule, payPeriod, ymdOf, formatPayday } from '../core/payday.js';

let intervalId = null;

function makeIsWorkDay(workDays) {
    const DAY_MAP = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
    return (date) => workDays.includes(DAY_MAP[date.getDay()]);
}

export function stopTopbarSalaryTicker() {
    if (intervalId) {
        clearInterval(intervalId);
        intervalId = null;
    }
    const el = document.getElementById("topbar-salary-ticker");
    if (el) el.innerHTML = "";
    const gauge = document.getElementById("topbar-gauge");
    if (gauge) gauge.style.width = "0%";
    const expenseGauge = document.getElementById("topbar-gauge-expense");
    if (expenseGauge) expenseGauge.style.width = "0%";
}

export async function initTopbarSalaryTicker() {
    stopTopbarSalaryTicker();

    const el = document.getElementById("topbar-salary-ticker");
    if (!el || !authStore.isLoggedIn()) return;

    const now = new Date();
    let schedule;
    try {
        ({ data: schedule } = await axios.get("/api/auth/work-schedule"));
    } catch (e) {
        return; // 실패하면 조용히 숨김 (topbar를 방해하지 않도록)
    }

    // 💵 금액 방식: FIXED(고정 금액, 시작일마다 자동 기록) / BUDGET(한 달 예산) / 그 외(설정 안 함 = 예전 방식)
    const mode = ["FIXED", "BUDGET"].includes(schedule.salaryMode) ? schedule.salaryMode : null;
    // 게이지: 근무 시간에 따라 쌓이게(SALARY) / 남은 돈(BALANCE). 예산은 항상 남은 돈
    const workGauge = mode === "BUDGET" ? false : schedule.incomeType !== "BALANCE";

    // 📅 게이지 기간: 시작일(월급날)을 정했으면 '지난 시작일 ~ 다음 시작일', 아니면 이번 달 1일~말일
    const usePayday = hasPayRule(schedule);
    const period = usePayday
        ? payPeriod(now, schedule)
        : { start: new Date(now.getFullYear(), now.getMonth(), 1), end: new Date(now.getFullYear(), now.getMonth() + 1, 1) };
    const fromYmd = ymdOf(period.start);
    const toYmd = ymdOf(new Date(period.end.getFullYear(), period.end.getMonth(), period.end.getDate() - 1));

    // 📝 고정 금액: 이번 기간 시작일에 가계부 자동 기록 (서버가 기간마다 한 번만, 지운 건 다시 안 넣음)
    let autoTxId = null;
    if (mode === "FIXED") {
        try {
            const { data } = await axios.post("/api/money/auto-income/ensure", { periodStart: fromYmd, periodEnd: toYmd });
            autoTxId = data?.transactionId ?? null;
            if (data?.created && data.duplicates?.length) {
                const d = data.duplicates[0];
                showTopbarNotice(`📝 ${Number(d.amount).toLocaleString("ko-KR")}원 '${d.category}'을 ${Number(fromYmd.slice(5, 7))}월 ${Number(fromYmd.slice(8))}일에 자동으로 기록했어요. `
                    + `그런데 ${Number(String(d.date).slice(5, 7))}/${Number(String(d.date).slice(8, 10))}에 같은 내역이 이미 있어요. 중복이면 하나를 지워주세요.`);
            }
        } catch (e) { /* 자동 기록이 안 돼도 게이지는 그림 */ }
    }

    let transactions;
    try {
        ({ data: transactions } = await axios.get("/api/money/ledger", { params: { year: now.getFullYear(), month: now.getMonth() + 1 } }));
        // 기간이 지난달에 걸치거나, 최근 '월급' 내역을 찾으려면 이번 달 밖의 내역도 필요 → 읽기 전용으로 조회
        if (usePayday || mode) {
            const lookback = new Date(period.start.getFullYear(), period.start.getMonth() - 2, 1);
            const { data } = await axios.get("/api/money/ledger/range", { params: { from: ymdOf(lookback), to: toYmd } });
            const seen = new Set(transactions.map(tx => tx.id));
            transactions = transactions.concat((data || []).filter(tx => !seen.has(tx.id)));
        }
    } catch (e) {
        return;
    }

    // 💰 기준 금액
    let salaryAmount;
    let excludeIncome = (tx) => tx.category === "월급"; // 게이지 금액 자체인 수입은 '다른 수입'에서 뺌
    if (mode === "FIXED") {
        // 자동 기록된 내역이 있으면 그 금액 (사용자가 이번 달 금액을 고쳤으면 고친 금액)
        const autoTx = transactions.find(tx => tx.id === autoTxId);
        salaryAmount = autoTx ? Number(autoTx.amount) : Number(schedule.salaryAmount) || 0;
        const cat = schedule.incomeCategory || "용돈";
        excludeIncome = (tx) => tx.id === autoTxId || tx.category === cat;
    } else if (mode === "BUDGET") {
        salaryAmount = Number(schedule.salaryAmount) || 0;
    } else if (usePayday) {
        // 오늘까지 등록된 '월급' 중 가장 최근 것
        const todayYmd = ymdOf(now);
        const latest = transactions
            .filter(tx => tx.type === "INCOME" && tx.category === "월급" && tx.date <= todayYmd)
            .sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : b.id - a.id))[0]
            || transactions.find(tx => tx.type === "INCOME" && tx.category === "월급");
        salaryAmount = latest ? Number(latest.amount) : 0;
    } else {
        // 예전 방식 그대로: 이번 달 '월급' 내역
        const salaryTx = transactions.find(tx => tx.type === "INCOME" && tx.category === "월급" && tx.date >= fromYmd && tx.date <= toYmd);
        salaryAmount = salaryTx ? Number(salaryTx.amount) : 0;
    }
    if (!salaryAmount) return; // 금액을 알 수 없으면 표시 안 함

    if (!workGauge) {
        renderBalanceGauge({ isBudget: mode === "BUDGET", amount: salaryAmount, category: schedule.incomeCategory || "용돈",
                             excludeIncome, transactions, period, usePayday, fromYmd, toYmd });
        return;
    }

    // 월급 외 수입/지출은 시간에 걸쳐 쌓이는 게 아니라 등록하는 즉시 게이지에 반영된다. (게이지 기간 안의 내역만)
    const inPeriod = transactions.filter(tx => tx.date >= fromYmd && tx.date <= toYmd);
    const otherIncomeAmount = inPeriod
        .filter(tx => tx.type === "INCOME" && !excludeIncome(tx))
        .reduce((sum, tx) => sum + Number(tx.amount), 0);
    const expenseAmount = inPeriod
        .filter(tx => tx.type === "EXPENSE")
        .reduce((sum, tx) => sum + Number(tx.amount), 0);

    const workDays = (schedule.workDays || "MON,TUE,WED,THU,FRI").split(",");
    const [wsH, wsM] = (schedule.workStartTime || "09:00:00").split(":").map(Number);
    const [weH, weM] = (schedule.workEndTime || "18:00:00").split(":").map(Number);
    const isWorkDay = makeIsWorkDay(workDays);

    const daySeconds = (date) => {
        if (!isWorkDay(date)) return 0;
        return Math.max(0, (weH * 3600 + weM * 60) - (wsH * 3600 + wsM * 60));
    };

    // 게이지 기간: 월급날을 정했으면 월급날 ~ 다음 월급날, 아니면 달력 기준(1일~말일)
    // (기간이 바뀌면 — 월급날이 지나면 — 내역을 다시 불러와서 0부터 새로 시작)
    const periodBounds = () => period;

    const totalWorkSeconds = (periodStart, periodEnd) => {
        let total = 0;
        const cursor = new Date(periodStart);
        cursor.setHours(0, 0, 0, 0);
        const endDay = new Date(periodEnd);
        endDay.setHours(0, 0, 0, 0);
        while (cursor < endDay) {
            total += daySeconds(cursor);
            cursor.setDate(cursor.getDate() + 1);
        }
        return total;
    };

    const elapsedWorkSeconds = (periodStart, nowTick) => {
        let total = 0;
        const cursor = new Date(periodStart);
        cursor.setHours(0, 0, 0, 0);
        const today = new Date(nowTick);
        today.setHours(0, 0, 0, 0);
        while (cursor < today) {
            total += daySeconds(cursor);
            cursor.setDate(cursor.getDate() + 1);
        }
        if (isWorkDay(nowTick)) {
            const startOfWork = new Date(nowTick.getFullYear(), nowTick.getMonth(), nowTick.getDate(), wsH, wsM, 0);
            const endOfWork = new Date(nowTick.getFullYear(), nowTick.getMonth(), nowTick.getDate(), weH, weM, 0);
            if (nowTick >= startOfWork) {
                const clamped = nowTick < endOfWork ? nowTick : endOfWork;
                total += (clamped - startOfWork) / 1000;
            }
        }
        return total;
    };

    el.innerHTML = `
        <span class="topbar-salary-status" id="topbarSalaryStatus">
            <span class="topbar-salary-dot" id="topbarSalaryDot"></span>
            <span id="topbarSalaryStatusText"></span>
        </span>
        <span id="topbarSalaryAmount"></span>
    `;

    const tick = () => {
        const amountEl = document.getElementById("topbarSalaryAmount");
        if (!amountEl) {
            clearInterval(intervalId);
            intervalId = null;
            return;
        }
        const nowTick = new Date();
        if (nowTick >= period.end) { initTopbarSalaryTicker(); return; }
        const { start, end } = periodBounds();
        const total = totalWorkSeconds(start, end);
        const elapsed = Math.min(elapsedWorkSeconds(start, nowTick), total);
        const accruedSalary = total > 0 ? Math.floor(salaryAmount * (elapsed / total)) : 0;
        const earned = accruedSalary + otherIncomeAmount;

        const todayIsWorkDay = isWorkDay(nowTick);
        const startOfWork = new Date(nowTick.getFullYear(), nowTick.getMonth(), nowTick.getDate(), wsH, wsM, 0);
        const endOfWork = new Date(nowTick.getFullYear(), nowTick.getMonth(), nowTick.getDate(), weH, weM, 0);
        const workingNow = todayIsWorkDay && nowTick >= startOfWork && nowTick < endOfWork;

        amountEl.textContent = `💰 ${earned.toLocaleString("ko-KR")}원`;
        const statusText = workingNow ? "근무중" : (todayIsWorkDay ? "대기중" : "휴무일");
        const dot = document.getElementById("topbarSalaryDot");
        if (dot) {
            dot.classList.toggle("is-working", workingNow);
        }
        const statusTextEl = document.getElementById("topbarSalaryStatusText");
        if (statusTextEl) {
            statusTextEl.textContent = statusText;
        }
        const statusWrap = document.getElementById("topbarSalaryStatus");
        if (statusWrap) {
            const base = workingNow ? "근무 중" : (todayIsWorkDay ? "근무 시간 아님" : "휴무일");
            statusWrap.title = usePayday ? `${base} · 다음 월급날 ${formatPayday(period.end)}` : base;
        }

        const gauge = document.getElementById("topbar-gauge");
        if (gauge) {
            const percent = Math.min(100, (earned / salaryAmount) * 100);
            gauge.style.width = `${percent}%`;
        }

        const expenseGauge = document.getElementById("topbar-gauge-expense");
        if (expenseGauge) {
            const expensePercent = Math.min(100, (expenseAmount / salaryAmount) * 100);
            expenseGauge.style.width = `${expensePercent}%`;
        }
    };

    tick();
    intervalId = setInterval(tick, 1000);
}

/**
 * 🎒 용돈·정기 수입(ALLOWANCE) / 💳 예산(BUDGET) 게이지
 * - 근무 시간으로 쌓이는 게 아니라 '받은 돈(또는 예산)에서 얼마 남았나'를 보여준다
 * - 왼쪽(초록) = 남은 비율, 오른쪽(빨강) = 쓴 비율
 * - 글자: 💰 남은 돈 · 하루에 쓸 수 있는 돈 (= 남은 돈 ÷ 다음 받는 날까지 남은 일수), 상태: D-n
 */
function renderBalanceGauge({ isBudget, amount, category, excludeIncome, transactions, period, usePayday, fromYmd, toYmd }) {
    const el = document.getElementById("topbar-salary-ticker");
    const inPeriod = transactions.filter(tx => tx.date >= fromYmd && tx.date <= toYmd);
    const expense = inPeriod.filter(tx => tx.type === "EXPENSE").reduce((sum, tx) => sum + Number(tx.amount), 0);
    // 고정 금액 방식: 그 외에 기간 안에 들어온 다른 수입은 남은 돈에 더함 (예산 방식은 지출 한도만 봄)
    const otherIncome = isBudget ? 0 : inPeriod
        .filter(tx => tx.type === "INCOME" && !excludeIncome(tx))
        .reduce((sum, tx) => sum + Number(tx.amount), 0);
    const total = amount + otherIncome;
    const remaining = total - expense;
    const label = isBudget ? "남은 예산" : (category === "용돈" ? "남은 용돈" : "남은 돈");
    const nextLabel = isBudget ? "새 예산 시작" : "다음 받는 날";

    el.innerHTML = `
        <span class="topbar-salary-status" id="topbarSalaryStatus">
            <span id="topbarSalaryStatusText"></span>
        </span>
        <span id="topbarSalaryAmount"></span>
    `;

    const tick = () => {
        const amountEl = document.getElementById("topbarSalaryAmount");
        if (!amountEl) {
            clearInterval(intervalId);
            intervalId = null;
            return;
        }
        const nowTick = new Date();
        if (nowTick >= period.end) { initTopbarSalaryTicker(); return; }
        const today0 = new Date(nowTick.getFullYear(), nowTick.getMonth(), nowTick.getDate());
        const daysLeft = Math.max(1, Math.round((period.end - today0) / 86400000)); // 오늘 포함
        const daily = Math.max(0, Math.floor(remaining / daysLeft));

        amountEl.innerHTML = remaining >= 0
            ? `💰 ${remaining.toLocaleString("ko-KR")}원<span class="topbar-balance-daily"> · 하루 ${daily.toLocaleString("ko-KR")}원</span>`
            : `💸 ${(-remaining).toLocaleString("ko-KR")}원 초과`;
        document.getElementById("topbarSalaryStatusText").textContent = `D-${daysLeft}`;
        const statusWrap = document.getElementById("topbarSalaryStatus");
        const tip = `${label} ${remaining.toLocaleString("ko-KR")}원 · 하루 ${daily.toLocaleString("ko-KR")}원 · ${nextLabel} ${formatPayday(period.end)}`
            + (usePayday ? "" : " (매달 1일)");
        statusWrap.title = tip;
        amountEl.title = tip;

        const gauge = document.getElementById("topbar-gauge");
        if (gauge) gauge.style.width = `${Math.max(0, Math.min(100, (remaining / total) * 100))}%`;
        const expenseGauge = document.getElementById("topbar-gauge-expense");
        if (expenseGauge) expenseGauge.style.width = `${Math.min(100, (expense / total) * 100)}%`;
    };

    tick();
    intervalId = setInterval(tick, 60 * 1000);
}

/** 상단바 아래 잠깐 뜨는 안내 (자동 기록 중복 알림 등) */
function showTopbarNotice(text) {
    document.querySelector(".topbar-notice")?.remove();
    const box = document.createElement("div");
    box.className = "topbar-notice";
    box.setAttribute("role", "status");
    box.innerHTML = `<span></span><button type="button" aria-label="닫기">✕</button>`;
    box.querySelector("span").textContent = text;
    box.querySelector("button").onclick = () => box.remove();
    document.body.appendChild(box);
    setTimeout(() => box.remove(), 15000);
}
