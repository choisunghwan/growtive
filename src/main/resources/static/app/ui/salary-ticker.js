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
    let transactions, schedule;
    try {
        const [txRes, scheduleRes] = await Promise.all([
            axios.get("/api/money/ledger", { params: { year: now.getFullYear(), month: now.getMonth() + 1 } }),
            axios.get("/api/auth/work-schedule")
        ]);
        transactions = txRes.data;
        schedule = scheduleRes.data;
    } catch (e) {
        return; // 실패하면 조용히 숨김 (topbar를 방해하지 않도록)
    }

    // 📅 게이지 기간: 월급날을 정했으면 '지난 월급날 ~ 다음 월급날', 아니면 이번 달 1일~말일
    const usePayday = hasPayRule(schedule);
    const period = usePayday
        ? payPeriod(now, schedule)
        : { start: new Date(now.getFullYear(), now.getMonth(), 1), end: new Date(now.getFullYear(), now.getMonth() + 1, 1) };
    const fromYmd = ymdOf(period.start);
    const toYmd = ymdOf(new Date(period.end.getFullYear(), period.end.getMonth(), period.end.getDate() - 1));

    if (usePayday) {
        // 기간이 지난달에 걸치거나, 최근 '월급' 내역을 찾으려면 이번 달 밖의 내역도 필요 → 읽기 전용으로 조회
        const lookback = new Date(period.start.getFullYear(), period.start.getMonth() - 2, 1);
        try {
            const { data } = await axios.get("/api/money/ledger/range", { params: { from: ymdOf(lookback), to: toYmd } });
            const seen = new Set(transactions.map(tx => tx.id));
            transactions = transactions.concat((data || []).filter(tx => !seen.has(tx.id)));
        } catch (e) {
            return;
        }
    }

    // 💰 월급 금액: 고정 금액 / 가계부의 '월급' 내역
    let salaryAmount;
    if (schedule.salaryMode === "FIXED" && Number(schedule.salaryAmount) > 0) {
        salaryAmount = Number(schedule.salaryAmount);
    } else if (usePayday) {
        // 오늘까지 등록된 '월급' 중 가장 최근 것 (매달 금액이 달라도 가장 최근 월급 기준)
        const todayYmd = ymdOf(now);
        const latest = transactions
            .filter(tx => tx.type === "INCOME" && tx.category === "월급" && tx.date <= todayYmd)
            .sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : b.id - a.id))[0]
            // 아직 한 번도 안 받았으면 이번 기간에 미리 적어둔 월급이라도
            || transactions.find(tx => tx.type === "INCOME" && tx.category === "월급");
        salaryAmount = latest ? Number(latest.amount) : 0;
    } else {
        // 예전 방식 그대로: 이번 달 '월급' 내역
        const salaryTx = transactions.find(tx => tx.type === "INCOME" && tx.category === "월급");
        salaryAmount = salaryTx ? Number(salaryTx.amount) : 0;
    }
    if (!salaryAmount) return; // 월급을 알 수 없으면 표시 안 함

    // 월급 외 수입/지출은 시간에 걸쳐 쌓이는 게 아니라 등록하는 즉시 게이지에 반영된다. (게이지 기간 안의 내역만)
    const inPeriod = transactions.filter(tx => tx.date >= fromYmd && tx.date <= toYmd);
    const otherIncomeAmount = inPeriod
        .filter(tx => tx.type === "INCOME" && tx.category !== "월급")
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
