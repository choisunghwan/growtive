export default function DashboardPage() {
    return {
        title: "대시보드",

        state: {
            startYear: 2026,
            startMonth: 2,
            months: 72,
            target: 100000000,
            monthlyIncrease: 200000
        },

        render() {
            return `
        <section class="dashboard">

          <div class="card">
            <h1 class="title">GrowTive</h1>
            <p class="subtitle">재무 실험실</p>
          </div>

          <!-- 🔥 월급 흐름 -->
          <div class="card" style="margin-top:20px;">
            <h3>월급 흐름</h3>
            <div class="chart-wrapper">
              <canvas id="sankeyChart"></canvas>
            </div>
            <div id="remainingInfo" style="margin-top:10px;"></div>
          </div>

          <!-- 📝 월별 재무 입력 -->
          <div class="card" style="margin-top:20px;">
            <h3>월별 재무 입력</h3>
            <div style="font-size:13px; opacity:0.75; margin-top:6px;">
              해당 월의 월급/지출/투자 등 월별 금액을 입력하고 저장하세요.
            </div>

            <div id="snapshotInputs" style="margin-top:15px;"></div>

            <div style="display:flex; gap:10px; margin-top:12px; flex-wrap:wrap;">
              <button id="saveSnapshotBtn">저장</button>
              <button id="reloadSnapshotBtn" type="button">다시 불러오기</button>
              <div id="snapshotStatus" style="align-self:center; font-size:13px; opacity:0.8;"></div>
            </div>
          </div>

          <!-- 🎛 재무 설정 -->
          <div class="card" style="margin-top:20px;">
            <h3>재무 설정</h3>

            <div style="margin-top:15px;">
              <label>목표 금액: <b id="targetLabel"></b></label>
              <input type="range" id="targetSlider" min="50000000" max="300000000" step="10000000">
            </div>

            <div style="margin-top:15px;">
              <label>추가 투자: <b id="increaseLabel"></b></label>
              <input type="range" id="increaseSlider" min="0" max="1000000" step="50000">
            </div>

            <div style="margin-top:15px;">
              <label>기간 (개월): <b id="monthsLabel"></b></label>
              <input type="range" id="monthsSlider" min="24" max="180" step="6">
            </div>
          </div>

          <!-- 💰 요약 -->
          <div class="card" style="margin-top:20px;">
            <h3>재무 요약</h3>
            <div id="moneySummary" style="display:flex; gap:12px; flex-wrap:wrap;"></div>
          </div>

          <!-- 📈 자산 성장 -->
          <div class="card" style="margin-top:20px;">
            <h3>자산 성장 예측</h3>
            <div class="chart-wrapper">
              <canvas id="moneyChart"></canvas>
            </div>
          </div>

        </section>
      `;
        },

        async onMounted() {

            // Chart.js 로드
            if (!window.Chart) {
                const script = document.createElement("script");
                script.src = "https://cdn.jsdelivr.net/npm/chart.js@4.4.1";
                document.body.appendChild(script);
                await new Promise(resolve => script.onload = resolve);
            }

            // Sankey 플러그인 로드
            if (!window.SankeyController) {
                const sankeyScript = document.createElement("script");
                sankeyScript.src = "https://cdn.jsdelivr.net/npm/chartjs-chart-sankey@0.12.0/dist/chartjs-chart-sankey.min.js";
                document.body.appendChild(sankeyScript);
                await new Promise(resolve => sankeyScript.onload = resolve);
            }

            this.initSliders();

            // 최초 로드: 입력 → 대시보드/차트 → Sankey
            await this.loadSnapshotInputs();
            this.bindSnapshotButtons();

            await this.updateDashboard();
            await this.renderSankey();
        },

        /* ---------------- Snapshot 입력 UI ---------------- */

        async loadSnapshotInputs() {
            const { startYear, startMonth } = this.state;

            const statusEl = document.getElementById("snapshotStatus");
            const container = document.getElementById("snapshotInputs");

            if (!container) return;

            try {
                statusEl && (statusEl.innerText = "불러오는 중...");

                const res = await fetch(`/api/money/snapshot?year=${startYear}&month=${startMonth}`);
                if (!res.ok) {
                    throw new Error(`snapshot 조회 실패: ${res.status}`);
                }

                const nodes = await res.json();

                container.innerHTML = "";

                if (!Array.isArray(nodes) || nodes.length === 0) {
                    container.innerHTML = `
                      <div style="font-size:13px; opacity:0.8;">
                        입력 가능한 항목이 없습니다. (template/snapshot 생성 상태를 확인하세요)
                      </div>
                    `;
                    statusEl && (statusEl.innerText = "");
                    return;
                }

                nodes.forEach(node => {
                    const amount = (node.monthlyAmount ?? 0);
                    container.innerHTML += `
                        <div style="margin-bottom:12px;">
                            <label style="display:block; font-size:14px; margin-bottom:6px;">
                                ${node.name} <span style="font-size:12px; opacity:0.7;">(${node.type})</span>
                            </label>
                            <input type="number"
                                   data-id="${node.id}"
                                   value="${amount}"
                                   style="width:100%; padding:8px; box-sizing:border-box;"
                                   placeholder="0" />
                        </div>
                    `;
                });

                statusEl && (statusEl.innerText = `${startYear}-${String(startMonth).padStart(2, "0")} 입력 항목 로드 완료`);
            } catch (e) {
                console.error(e);
                container.innerHTML = `
                  <div style="font-size:13px; color:#c0392b;">
                    스냅샷 입력 항목 로드 실패: ${e.message}
                  </div>
                `;
                statusEl && (statusEl.innerText = "");
            }
        },

        bindSnapshotButtons() {
            const saveBtn = document.getElementById("saveSnapshotBtn");
            const reloadBtn = document.getElementById("reloadSnapshotBtn");

            if (saveBtn) {
                saveBtn.onclick = async () => {
                    await this.saveSnapshotInputs();
                };
            }

            if (reloadBtn) {
                reloadBtn.onclick = async () => {
                    await this.loadSnapshotInputs();
                };
            }
        },

        async saveSnapshotInputs() {
            const { startYear, startMonth } = this.state;

            const statusEl = document.getElementById("snapshotStatus");
            const inputs = document.querySelectorAll("#snapshotInputs input[data-id]");

            if (!inputs || inputs.length === 0) {
                alert("저장할 입력 항목이 없습니다.");
                return;
            }

            const nodes = Array.from(inputs).map(input => ({
                snapshotId: Number(input.dataset.id),
                amount: Number(input.value || 0)
            }));

            try {
                statusEl && (statusEl.innerText = "저장 중...");

                const res = await fetch("/api/money/snapshot/update", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        year: startYear,
                        month: startMonth,
                        nodes
                    })
                });

                if (!res.ok) {
                    throw new Error(`저장 실패: ${res.status}`);
                }

                statusEl && (statusEl.innerText = "저장 완료! 대시보드 갱신 중...");

                // 저장 후: 대시보드/차트/샌키 갱신
                await this.updateDashboard();
                await this.renderSankey();

                statusEl && (statusEl.innerText = "저장 완료 + 갱신 완료");
            } catch (e) {
                console.error(e);
                alert(`저장 실패: ${e.message}`);
                statusEl && (statusEl.innerText = "");
            }
        },

        /* ---------------- Sankey ---------------- */

        async renderSankey() {

            const res = await fetch(`/api/money/flow?year=${this.state.startYear}&month=${this.state.startMonth}`);
            const data = await res.json();

            const ctx = document.getElementById("sankeyChart");

            if (window.__sankeyChart) window.__sankeyChart.destroy();

            window.__sankeyChart = new Chart(ctx, {
                type: "sankey",
                data: {
                    datasets: [{
                        label: "월급 흐름",
                        data: data.links.map(l => ({
                            from: data.nodes.find(n => n.id === l.source).name,
                            to: data.nodes.find(n => n.id === l.target).name,
                            flow: l.value
                        }))
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
                                    `${ctx.raw.from} → ${ctx.raw.to}: ${ctx.raw.flow.toLocaleString("ko-KR")}원`
                            }
                        }
                    }
                }
            });

            const remainingNode = data.nodes.find(n => n.type === "REMAIN");
            if (remainingNode) {
                document.getElementById("remainingInfo").innerHTML =
                    `<div style="color:#2ecc71;font-weight:600;">
                      ● 이번 달 가용금: ${remainingNode.monthlyAmount.toLocaleString("ko-KR")}원
                    </div>`;
            }
        },

        /* ---------------- 슬라이더 ---------------- */

        initSliders() {
            const targetSlider = document.getElementById("targetSlider");
            const increaseSlider = document.getElementById("increaseSlider");
            const monthsSlider = document.getElementById("monthsSlider");

            targetSlider.value = this.state.target;
            increaseSlider.value = this.state.monthlyIncrease;
            monthsSlider.value = this.state.months;

            const updateLabels = () => {
                document.getElementById("targetLabel").innerText =
                    Number(targetSlider.value).toLocaleString("ko-KR") + "원";
                document.getElementById("increaseLabel").innerText =
                    Number(increaseSlider.value).toLocaleString("ko-KR") + "원";
                document.getElementById("monthsLabel").innerText =
                    monthsSlider.value + "개월";
            };

            updateLabels();

            targetSlider.oninput = async () => {
                this.state.target = Number(targetSlider.value);
                updateLabels();
                await this.updateDashboard();
            };

            increaseSlider.oninput = async () => {
                this.state.monthlyIncrease = Number(increaseSlider.value);
                updateLabels();
                await this.updateDashboard();
            };

            monthsSlider.oninput = async () => {
                this.state.months = Number(monthsSlider.value);
                updateLabels();
                await this.updateDashboard();
            };
        },

        /* ---------------- 데이터 갱신 ---------------- */

        async updateDashboard() {

            const { startYear, startMonth, months, target, monthlyIncrease } = this.state;

            const chartRes = await fetch(`/api/money/chart?year=${startYear}&month=${startMonth}&months=${months}&target=${target}`);
            const chartData = await chartRes.json();

            const goalRes = await fetch(`/api/money/goal?year=${startYear}&month=${startMonth}&target=${target}`);
            const goalData = await goalRes.json();

            const compareRes = await fetch(`/api/money/compare-goal?year=${startYear}&month=${startMonth}&target=${target}&monthlyIncrease=${monthlyIncrease}`);
            const compareData = await compareRes.json();

            this.renderSummary(target, goalData, compareData);
            this.renderChart(chartData);
        },

        /* ---------------- 요약 ---------------- */

        renderSummary(target, base, improved) {
            const el = document.getElementById("moneySummary");

            el.innerHTML = `
              <div style="flex:1; min-width:220px;">
                <div>목표</div>
                <b>${Number(target).toLocaleString("ko-KR")}원</b>
              </div>
              <div style="flex:1; min-width:220px;">
                <div>기본 도달</div>
                <b>${base.achievedYear}-${String(base.achievedMonth).padStart(2,"0")}</b>
              </div>
              <div style="flex:1; min-width:220px;">
                <div>추가 투자 도달</div>
                <b>${improved.improvedYear}-${String(improved.improvedMonth).padStart(2,"0")}</b>
              </div>
            `;
        },

        /* ---------------- 라인 차트 ---------------- */

        renderChart(data) {

            const ctx = document.getElementById("moneyChart");

            if (window.__moneyChart) window.__moneyChart.destroy();

            window.__moneyChart = new Chart(ctx, {
                type: "line",
                data: {
                    labels: data.labels,
                    datasets: [
                        {
                            label: "기본 투자",
                            data: data.assetSeries,
                            tension: 0.25,
                            pointRadius: 3,
                            fill: false
                        },
                        {
                            label: "+20만원 투자",
                            data: data.extraSeries,
                            tension: 0.25,
                            pointRadius: 3,
                            fill: false
                        },
                        {
                            label: "목표선",
                            data: data.targetLine,
                            borderDash: [6,6],
                            pointRadius: 0
                        }
                    ]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    interaction: {
                        mode: 'index',
                        intersect: false
                    },
                    plugins: {
                        tooltip: {
                            enabled: true,
                            mode: 'index',
                            intersect: false,
                            callbacks: {
                                label: ctx =>
                                    `${ctx.dataset.label}: ${ctx.parsed.y.toLocaleString("ko-KR")}원`
                            }
                        }
                    },
                    scales: {
                        y: {
                            ticks: {
                                callback: value =>
                                    value.toLocaleString("ko-KR")
                            }
                        }
                    }
                }
            });
        }
    };
}