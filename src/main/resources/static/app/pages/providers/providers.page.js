// providers.page.js
export default function ProvidersPage() {
    return {
        title: "서비스 제공자 설정",

        render() {
            return `
        <section class="providers-page">
          <div class="card provider-card-list">
            <div class="provider-header">
              <div class="provider-header-title">활성화된 서비스 제공자</div>
              <span class="provider-count-tag" id="provider-count">0</span>
            </div>

            <div class="provider-list">

              <!-- ComfyUI -->
              <div class="provider-row">
                <div class="provider-main">
                  <div class="provider-logo provider-logo-comfy">C</div>
                  <div class="provider-text">
                    <div class="provider-name">ComfyUI</div>
                    <div class="provider-desc">
                      강력한 오픈 소스 이미지·비디오·오디오 생성 워크플로우 엔진으로,
                      노드 기반 워크플로우 편집과 프라이빗 배포를 지원합니다.
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  class="provider-switch is-on"
                  data-provider="comfyui"
                  aria-pressed="true"
                  aria-label="ComfyUI 활성화 전환">
                  <span class="provider-switch-handle"></span>
                </button>
              </div>

              <div class="provider-divider"></div>

              <!-- Fal -->
              <div class="provider-row">
                <div class="provider-main">
                  <div class="provider-logo provider-logo-fal">F</div>
                  <div class="provider-text">
                    <div class="provider-name">Fal</div>
                    <div class="provider-desc">
                      개발자를 위한 생성형 미디어 플랫폼으로,
                      다양한 이미지·비디오 생성 API를 제공합니다.
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  class="provider-switch is-on"
                  data-provider="fal"
                  aria-pressed="true"
                  aria-label="Fal 활성화 전환">
                  <span class="provider-switch-handle"></span>
                </button>
              </div>

            </div>
          </div>
        </section>
      `;
        },

        onMounted() {
            console.log("[Providers] Mounted");

            const switches = document.querySelectorAll(".provider-switch");
            const countEl = document.getElementById("provider-count");

            function updateCount() {
                const activeCount = document.querySelectorAll(".provider-switch.is-on").length;
                if (countEl) {
                    countEl.textContent = String(activeCount);
                }
            }

            switches.forEach((btn) => {
                btn.addEventListener("click", () => {
                    const isOn = btn.classList.toggle("is-on");
                    btn.setAttribute("aria-pressed", isOn ? "true" : "false");

                    const provider = btn.getAttribute("data-provider");
                    console.log("[Provider Toggle]", provider, isOn ? "ON" : "OFF");

                    // TODO: 나중에 여기서 백엔드에 상태 저장 API 호출하면 됨
                    // apiClient.post('/api/providers/toggle', { provider, enabled: isOn });

                    updateCount();
                });
            });

            // 최초 카운트 세팅
            updateCount();
        },
    };
}
