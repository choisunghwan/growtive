export default function DashboardPage() {
    const now = new Date();

    return {
        title: "자산 흐름",

        state: {
            year: now.getFullYear(),
            month: now.getMonth() + 1
        },

        render() {
            return `
        <section class="dashboard">

          <div class="card">
            <h1 class="title">자산 흐름</h1>
            <p class="subtitle">이번 달 돈이 어디로 흘러가는지 확인하세요</p>

            <div style="display:flex; align-items:center; gap:10px; margin-top:16px; flex-wrap:wrap;">
              <button id="prevMonthBtn" type="button">◀ 이전 달</button>
              <div id="currentMonthLabel" style="font-weight:700; font-size:16px;"></div>
              <button id="nextMonthBtn" type="button">다음 달 ▶</button>
              <button id="goCurrentMonthBtn" type="button">현재 월로</button>
            </div>
          </div>

          <!-- 🔥 월급 흐름 -->
          <div class="card" style="margin-top:20px;">
            <h3>월급 흐름</h3>
            <div style="font-size:13px; opacity:0.75; margin-top:6px;">
              가계부에 기록한 수입/지출을 기반으로 이번 달 돈의 흐름을 보여줍니다.
            </div>
            <div class="chart-wrapper sankey-scroll" style="margin-top:12px;">
              <div class="sankey-scroll-inner">
                <canvas id="sankeyChart"></canvas>
              </div>
            </div>
            <div id="remainingInfo" style="margin-top:10px;"></div>
          </div>

          <!-- 💰 요약 -->
          <div class="card" style="margin-top:20px;">
            <h3>재무 요약</h3>
            <div style="font-size:13px; opacity:0.75; margin-top:6px;">
              이번 달 수입/지출 요약입니다.
            </div>
            <div id="moneySummary" class="money-summary-grid"></div>
          </div>

        </section>
      `;
        },

        async onMounted() {
            if (!window.Chart) {
                const script = document.createElement("script");
                script.src = "https://cdn.jsdelivr.net/npm/chart.js@4.4.1";
                document.body.appendChild(script);
                await new Promise(resolve => script.onload = resolve);
            }

            if (!window.SankeyController) {
                const sankeyScript = document.createElement("script");
                sankeyScript.src = "https://cdn.jsdelivr.net/npm/chartjs-chart-sankey@0.12.0/dist/chartjs-chart-sankey.min.js";
                document.body.appendChild(sankeyScript);
                await new Promise(resolve => sankeyScript.onload = resolve);
            }

            this.bindMonthButtons();
            this.renderMonthLabel();

            await this.refreshAll();
        },

        /* ---------------- 공통 ---------------- */

        getYearMonthText() {
            return `${this.state.year}년 ${String(this.state.month).padStart(2, "0")}월`;
        },

        renderMonthLabel() {
            const labelEl = document.getElementById("currentMonthLabel");
            if (labelEl) {
                labelEl.innerText = this.getYearMonthText();
            }
        },

        moveMonth(diff) {
            let { year, month } = this.state;

            month += diff;

            if (month <= 0) {
                month = 12;
                year -= 1;
            } else if (month >= 13) {
                month = 1;
                year += 1;
            }

            this.state.year = year;
            this.state.month = month;
            this.renderMonthLabel();
        },

        async refreshAll() {
            await this.loadSummary();
            await this.renderSankey();
        },

        bindMonthButtons() {
            const prevBtn = document.getElementById("prevMonthBtn");
            const nextBtn = document.getElementById("nextMonthBtn");
            const currentBtn = document.getElementById("goCurrentMonthBtn");

            if (prevBtn) {
                prevBtn.onclick = async () => {
                    this.moveMonth(-1);
                    await this.refreshAll();
                };
            }

            if (nextBtn) {
                nextBtn.onclick = async () => {
                    this.moveMonth(1);
                    await this.refreshAll();
                };
            }

            if (currentBtn) {
                currentBtn.onclick = async () => {
                    const now = new Date();
                    this.state.year = now.getFullYear();
                    this.state.month = now.getMonth() + 1;
                    this.renderMonthLabel();
                    await this.refreshAll();
                };
            }
        },

        /* ---------------- Sankey ---------------- */

        // 카테고리가 너무 많으면 라벨이 겹치므로, 각 쪽(수입/지출) 상위 5개만 남기고
        // 나머지는 "기타 수입"/"기타 지출"로 합쳐서 보여준다 (실제 합계 데이터는 그대로 유지).
        buildDisplayFlow(data) {
            const nodes = data.nodes || [];
            const links = data.links || [];
            const hub = nodes.find(n => n.name === "총수입");
            const remain = nodes.find(n => n.type === "REMAIN");

            if (!hub) {
                return { sankeyData: [], hubName: null, remainName: null, incomeNames: new Set(), expenseNames: new Set() };
            }

            const byId = new Map(nodes.map(n => [n.id, n]));
            const MAX_PER_SIDE = 3;

            const condense = (sideLinks, pickNodeId) => {
                const sorted = [...sideLinks].sort((a, b) => b.value - a.value);
                const kept = sorted.slice(0, MAX_PER_SIDE).map(l => ({
                    name: byId.get(pickNodeId(l))?.name || "기타",
                    value: l.value
                }));
                const restTotal = sorted.slice(MAX_PER_SIDE).reduce((sum, l) => sum + l.value, 0);
                return { kept, restTotal };
            };

            const incomeLinks = links.filter(l => l.target === hub.id);
            const expenseLinks = links.filter(l => l.source === hub.id && (!remain || l.target !== remain.id));
            const remainLink = remain ? links.find(l => l.target === remain.id) : null;

            const income = condense(incomeLinks, l => l.source);
            const expense = condense(expenseLinks, l => l.target);

            const incomeNames = new Set(income.kept.map(i => i.name));
            const expenseNames = new Set(expense.kept.map(i => i.name));

            const sankeyData = [];
            income.kept.forEach(i => sankeyData.push({ from: i.name, to: hub.name, flow: i.value }));
            if (income.restTotal > 0) {
                sankeyData.push({ from: "기타 수입", to: hub.name, flow: income.restTotal });
                incomeNames.add("기타 수입");
            }
            expense.kept.forEach(i => sankeyData.push({ from: hub.name, to: i.name, flow: i.value }));
            if (expense.restTotal > 0) {
                sankeyData.push({ from: hub.name, to: "기타 지출", flow: expense.restTotal });
                expenseNames.add("기타 지출");
            }
            if (remainLink && remain) {
                sankeyData.push({ from: hub.name, to: remain.name, flow: remainLink.value });
            }

            return { sankeyData, hubName: hub.name, remainName: remain ? remain.name : null, incomeNames, expenseNames };
        },

        colorForNode(name, ctx) {
            const isDark = document.documentElement.classList.contains("dark");
            if (name === ctx.hubName) return isDark ? "#3b82f6" : "#2563eb";
            if (name === ctx.remainName) return isDark ? "#2dd4bf" : "#0d9488";
            if (ctx.incomeNames.has(name)) return isDark ? "#22c55e" : "#16a34a";
            if (ctx.expenseNames.has(name)) return isDark ? "#fca5a5" : "#dc2626";
            return isDark ? "#94a3b8" : "#64748b";
        },

        async renderSankey() {
            const res = await fetch(`/api/money/flow?year=${this.state.year}&month=${this.state.month}`);
            if (!res.ok) {
                throw new Error(`flow 조회 실패: ${res.status}`);
            }

            const data = await res.json();
            const canvas = document.getElementById("sankeyChart");

            if (!canvas) return;

            if (window.__sankeyChart) {
                window.__sankeyChart.destroy();
            }

            const flow = this.buildDisplayFlow(data);
            const isDark = document.documentElement.classList.contains("dark");
            const labelColor = isDark ? "#e5e9f2" : "#1e2530";
            const fontStack = "'Pretendard Variable', Pretendard, -apple-system, 'Segoe UI', Roboto, 'Noto Sans KR', 'Malgun Gothic', sans-serif";
            const isMobile = window.innerWidth <= 480;
            const sankeyFontSize = isMobile ? 9 : 12;

            window.__sankeyChart = new Chart(canvas, {
                type: "sankey",
                data: {
                    datasets: [{
                        label: `${this.getYearMonthText()} 자산 흐름`,
                        data: flow.sankeyData,
                        colorFrom: c => this.colorForNode(c.raw.from, flow),
                        colorTo: c => this.colorForNode(c.raw.to, flow),
                        colorMode: "gradient",
                        borderWidth: 0,
                        nodeWidth: isMobile ? 8 : 14,
                        color: labelColor,
                        font: { family: fontStack, size: sankeyFontSize, weight: "600" }
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        tooltip: {
                            enabled: true,
                            callbacks: {
                                label: ctx =>
                                    `${ctx.raw.from} → ${ctx.raw.to}: ${Number(ctx.raw.flow || 0).toLocaleString("ko-KR")}원`
                            }
                        }
                    }
                }
            });

            const remainingNode = (data.nodes || []).find(n => n.type === "REMAIN");
            const remainEl = document.getElementById("remainingInfo");

            if (remainEl) {
                if (remainingNode) {
                    remainEl.innerHTML =
                        `<div class="sankey-caption"><span class="dot"></span>${this.getYearMonthText()} 가용금 ${Number(remainingNode.monthlyAmount || 0).toLocaleString("ko-KR")}원</div>`;
                } else {
                    remainEl.innerHTML = `<div class="sankey-caption is-empty">${this.getYearMonthText()} 가용금 데이터가 없습니다.</div>`;
                }
            }
        },

        /* ---------------- 요약 ---------------- */

        async loadSummary() {
            const { year, month } = this.state;

            const res = await fetch(`/api/money/summary?year=${year}&month=${month}`);
            if (!res.ok) {
                throw new Error(`summary 조회 실패: ${res.status}`);
            }
            const summary = await res.json();

            const el = document.getElementById("moneySummary");
            if (!el) return;

            const won = n => Number(n || 0).toLocaleString("ko-KR") + "원";

            el.innerHTML = `
              <div class="money-stat money-stat--income">
                <div class="money-stat-label">총 수입</div>
                <div class="money-stat-value">${won(summary.totalIncome)}</div>
              </div>
              <div class="money-stat money-stat--expense">
                <div class="money-stat-label">총 지출</div>
                <div class="money-stat-value">${won(summary.totalExpense)}</div>
              </div>
              <div class="money-stat money-stat--remain">
                <div class="money-stat-label">잔액</div>
                <div class="money-stat-value">${won(summary.remaining)}</div>
              </div>
            `;
        }
    };
}
