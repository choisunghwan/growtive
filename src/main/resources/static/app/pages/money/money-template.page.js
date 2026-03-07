export default function MoneyTemplatePage() {
    return {
        title: "재무 템플릿 관리",

        state: {
            editingId: null
        },

        render() {
            return `
        <section class="dashboard">
          <div class="card">
            <h1 class="title">재무 템플릿 관리</h1>
            <p class="subtitle">
              월급 / 지출 / 투자 항목을 미리 설계해두면<br>
              대시보드에서 월별 입력이 훨씬 편해집니다.
            </p>
          </div>

          <!-- 입력 폼 -->
          <div class="card" style="margin-top:20px;">
            <h3>항목 추가 / 수정</h3>

            <form id="templateForm" style="margin-top:15px;">
              <div style="display:flex; flex-wrap:wrap; gap:12px;">
                <div style="flex:1; min-width:180px;">
                  <label>항목 이름</label>
                  <input type="text" id="tplName"
                         placeholder="예: 월급, 식비, 적금"
                         style="width:100%; padding:8px; box-sizing:border-box;">
                </div>

                <div style="width:160px;">
                  <label>타입</label>
                  <select id="tplType" style="width:100%; padding:8px; box-sizing:border-box;">
                    <option value="INCOME">수입 (INCOME)</option>
                    <option value="EXPENSE">지출 (EXPENSE)</option>
                    <option value="ASSET">자산/투자 (ASSET)</option>
                  </select>
                </div>

                <div style="width:180px;">
                  <label>기본 월 금액</label>
                  <input type="number" id="tplMonthly"
                         min="0"
                         style="width:100%; padding:8px; box-sizing:border-box;"
                         placeholder="0">
                </div>

                <div style="width:180px;">
                  <label>기대 수익률(%)</label>
                  <input type="number" id="tplReturn"
                         step="0.1"
                         style="width:100%; padding:8px; box-sizing:border-box;"
                         placeholder="0 (ASSET 전용)">
                </div>
              </div>

              <div style="margin-top:15px; display:flex; gap:10px;">
                <button type="submit" id="tplSaveBtn">추가</button>
                <button type="button" id="tplResetBtn">초기화</button>
                <div id="tplStatus" style="align-self:center; font-size:13px; opacity:0.8;"></div>
              </div>
            </form>
          </div>

          <!-- 목록 -->
          <div class="card" style="margin-top:20px;">
            <h3>템플릿 목록</h3>
            <div id="tplList" style="margin-top:10px; font-size:13px;"></div>
          </div>
        </section>
      `;
        },

        async onMounted() {
            this.bindForm();
            await this.loadTemplates();
        },

        bindForm() {
            const form = document.getElementById("templateForm");
            const resetBtn = document.getElementById("tplResetBtn");

            form.onsubmit = async (e) => {
                e.preventDefault();
                await this.saveTemplate();
            };

            resetBtn.onclick = () => {
                this.resetForm();
            };
        },

        resetForm() {
            this.state.editingId = null;
            document.getElementById("tplName").value = "";
            document.getElementById("tplType").value = "INCOME";
            document.getElementById("tplMonthly").value = "";
            document.getElementById("tplReturn").value = "";
            document.getElementById("tplSaveBtn").innerText = "추가";
            const statusEl = document.getElementById("tplStatus");
            statusEl.innerText = "";
        },

        async loadTemplates() {
            const listEl = document.getElementById("tplList");
            const statusEl = document.getElementById("tplStatus");

            listEl.innerHTML = "불러오는 중...";
            statusEl && (statusEl.innerText = "");

            try {
                const res = await fetch("/api/money/templates");
                if (!res.ok) {
                    throw new Error("템플릿 조회 실패: " + res.status);
                }
                const templates = await res.json();

                if (!Array.isArray(templates) || templates.length === 0) {
                    listEl.innerHTML = `
            <div style="opacity:0.7;">
              아직 등록된 템플릿이 없습니다.<br>
              위 폼에서 월급/지출/투자 항목을 추가해보세요.
            </div>
          `;
                    return;
                }

                listEl.innerHTML = `
          <table style="width:100%; border-collapse:collapse;">
            <thead>
              <tr style="border-bottom:1px solid rgba(255,255,255,0.1);">
                <th style="text-align:left; padding:6px;">이름</th>
                <th style="text-align:left; padding:6px;">타입</th>
                <th style="text-align:right; padding:6px;">기본 월 금액</th>
                <th style="text-align:right; padding:6px;">기대 수익률(%)</th>
                <th style="text-align:center; padding:6px;">액션</th>
              </tr>
            </thead>
            <tbody>
              ${templates.map(tpl => `
                <tr data-id="${tpl.id}" style="border-bottom:1px solid rgba(255,255,255,0.06);">
                  <td style="padding:6px;">${tpl.name}</td>
                  <td style="padding:6px;">${tpl.type}</td>
                  <td style="padding:6px; text-align:right;">
                    ${(tpl.defaultMonthlyAmount ?? 0).toLocaleString("ko-KR")}원
                  </td>
                  <td style="padding:6px; text-align:right;">
                    ${(tpl.defaultExpectedReturn ?? 0)}%
                  </td>
                  <td style="padding:6px; text-align:center;">
                    <button type="button" class="tpl-edit-btn">수정</button>
                    <button type="button" class="tpl-del-btn" style="margin-left:4px;">삭제</button>
                  </td>
                </tr>
              `).join("")}
            </tbody>
          </table>
        `;

                // 이벤트 바인딩
                listEl.querySelectorAll(".tpl-edit-btn").forEach(btn => {
                    btn.onclick = () => {
                        const tr = btn.closest("tr");
                        const id = Number(tr.dataset.id);
                        this.startEdit(id);
                    };
                });

                listEl.querySelectorAll(".tpl-del-btn").forEach(btn => {
                    btn.onclick = async () => {
                        const tr = btn.closest("tr");
                        const id = Number(tr.dataset.id);
                        await this.deleteTemplate(id);
                    };
                });

            } catch (e) {
                console.error(e);
                listEl.innerHTML = `
          <div style="color:#e74c3c;">
            템플릿 목록 로드 실패: ${e.message}
          </div>
        `;
            }
        },

        async saveTemplate() {
            const nameEl = document.getElementById("tplName");
            const typeEl = document.getElementById("tplType");
            const monthlyEl = document.getElementById("tplMonthly");
            const returnEl = document.getElementById("tplReturn");
            const statusEl = document.getElementById("tplStatus");
            const saveBtn = document.getElementById("tplSaveBtn");

            const name = nameEl.value.trim();
            const type = typeEl.value;
            const monthly = Number(monthlyEl.value || 0);
            const expectedReturn = returnEl.value === "" ? null : Number(returnEl.value);

            if (!name) {
                alert("항목 이름을 입력하세요.");
                nameEl.focus();
                return;
            }

            const payload = {
                name,
                type,
                defaultMonthlyAmount: monthly,
                defaultExpectedReturn: expectedReturn
            };

            try {
                statusEl.innerText = "저장 중...";
                saveBtn.disabled = true;

                const editingId = this.state.editingId;
                const method = editingId ? "PUT" : "POST";
                const url = editingId
                    ? `/api/money/templates/${editingId}`
                    : "/api/money/templates";

                const res = await fetch(url, {
                    method,
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(payload)
                });

                if (!res.ok) {
                    throw new Error(`저장 실패: ${res.status}`);
                }

                statusEl.innerText = editingId ? "수정 완료" : "추가 완료";
                this.resetForm();
                await this.loadTemplates();

            } catch (e) {
                console.error(e);
                alert(e.message);
                statusEl.innerText = "오류 발생";
            } finally {
                saveBtn.disabled = false;
            }
        },

        async deleteTemplate(id) {
            if (!confirm("이 템플릿을 삭제할까요? (해당 템플릿 기반 snapshot/flow는 별도)")) {
                return;
            }

            const statusEl = document.getElementById("tplStatus");
            statusEl.innerText = "삭제 중...";

            try {
                const res = await fetch(`/api/money/templates/${id}`, {
                    method: "DELETE"
                });
                if (!res.ok) {
                    throw new Error("삭제 실패: " + res.status);
                }

                statusEl.innerText = "삭제 완료";
                await this.loadTemplates();

            } catch (e) {
                console.error(e);
                alert(e.message);
                statusEl.innerText = "오류 발생";
            }
        },

        startEdit(id) {
            const row = document.querySelector(`#tplList tr[data-id="${id}"]`);
            if (!row) return;

            const name = row.children[0].innerText.trim();
            const type = row.children[1].innerText.trim();
            const monthlyText = row.children[2].innerText.replace(/[^0-9]/g, "");
            const returnText = row.children[3].innerText.replace("%", "").trim();

            document.getElementById("tplName").value = name;
            document.getElementById("tplType").value = type;
            document.getElementById("tplMonthly").value = monthlyText || "";
            document.getElementById("tplReturn").value = returnText || "";

            this.state.editingId = id;
            document.getElementById("tplSaveBtn").innerText = "수정";
            const statusEl = document.getElementById("tplStatus");
            statusEl.innerText = `수정 모드: #${id}`;
        }
    };
}