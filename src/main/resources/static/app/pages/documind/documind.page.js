// /static/app/pages/documind.page.js
import { uploadDocument,
    listDocuments,
    summarizeDocument,
    askDocument,
    deleteDocument,      // 🔥 이거 추가
} from '../../core/apiClient.js';

const DocuMindPage = {
    title: 'DocuMind (문서 요약·Q&A)',

    // 화면 템플릿
    render() {
        return `
      <div class="page documind">
        <h1>📝 DocuMind (문서 요약·Q&A)</h1>

        <!-- 1) 업로드 -->
        <section class="card">
          <h2>1) 문서 업로드</h2>
          <input type="file" id="dm-file" />
          <button id="dm-upload">업로드</button>
          <div id="dm-upload-msg" class="mt-8 text-muted"></div>
        </section>

        <!-- 2) 목록 -->
        <section class="card">
          <h2>2) 문서 목록</h2>
          <button id="dm-refresh">새로고침</button>
          <table class="table mt-8">
            <thead><tr><th>ID</th><th>제목</th><th>생성일</th><th>액션</th></tr></thead>
            <tbody id="dm-list"></tbody>
          </table>
        </section>

        <!-- 3) 선택 문서 작업 -->
        <section class="card">
          <h2>3) 선택 문서 작업</h2>
          <div class="row">
            <label>문서 ID</label>
            <input id="dm-docId" placeholder="예: 1" />
            <button id="dm-sum">요약 생성</button>
          </div>
          <pre id="dm-sum-out" class="mt-8 code"></pre>

          <div class="row mt-16">
            <input id="dm-q" class="flex-1" placeholder="질문을 입력하세요"/>
            <button id="dm-ask">질의</button>
          </div>
          <pre id="dm-ask-out" class="mt-8 code"></pre>
        </section>
      </div>
    `;
    },

    // 이벤트 바인딩 및 초기 데이터 로드
    onMounted(root) {
        const $ = (s) => root.querySelector(s);
        const $list = $('#dm-list');

        function fmtDate(s) {
            if (!s) return '';
            try { return new Date(s).toLocaleString(); } catch { return s; }
        }
        function escapeHtml(str) {
            return String(str || '').replace(/[&<>"']/g, m => ({
                '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;', "'":'&#39;'
            }[m]));
        }

        // 1) 업로드
        $('#dm-upload').addEventListener('click', async () => {
            const file = $('#dm-file').files?.[0];
            if (!file) return alert('파일을 선택하세요.');
            try {
                const doc = await uploadDocument(file);
                $('#dm-upload-msg').textContent = `업로드 완료: [${doc.id}] ${doc.title}`;
                await renderList();
            } catch (e) {
                console.error(e);
                alert('업로드 실패');
            }
        });

        // 2) 목록 렌더
        async function renderList() {
            const docs = await listDocuments();
            $list.innerHTML = docs.map(d => `
        <tr>
          <td>${d.id}</td>
          <td>${escapeHtml(d.title)}</td>
          <td>${fmtDate(d.createdAt)}</td>
          <td>
            <button class="dm-pick" data-id="${d.id}">선택</button>
            <button class="dm-del"  data-id="${d.id}">삭제</button>
          </td>
          
        </tr>
      `).join('');

            // 선택 → 입력칸에 ID 채우기
            $list.querySelectorAll('.dm-pick').forEach(btn => {
                btn.addEventListener('click', () => $('#dm-docId').value = btn.dataset.id);
            });
            // 🔥 삭제 버튼 이벤트
            $list.querySelectorAll('.dm-del').forEach(btn => {
                btn.addEventListener('click', async () => {
                    const id = btn.dataset.id;
                    if (!confirm(`문서 [${id}] 를 정말 삭제할까요?`)) return;
                    try {
                        await deleteDocument(id);
                        // 만약 선택되어 있던 ID와 같으면 입력창도 비워주기
                        if ($('#dm-docId').value === id) {
                            $('#dm-docId').value = '';
                            $('#dm-sum-out').textContent = '';
                            $('#dm-ask-out').textContent = '';
                        }
                        await renderList();
                    } catch (e) {
                        console.error(e);
                        alert('삭제 실패');
                    }
                });
            });



        }
        $('#dm-refresh').addEventListener('click', renderList);

        // 3) 요약
        $('#dm-sum').addEventListener('click', async () => {
            const id = $('#dm-docId').value?.trim();
            if (!id) return alert('문서 ID를 입력하세요.');
            $('#dm-sum-out').textContent = '요약 중...';
            try {
                const sum = await summarizeDocument(id);
                $('#dm-sum-out').textContent = sum.summaryText ?? '(요약 없음)';
                await renderList();
            } catch (e) {
                console.error(e);
                $('#dm-sum-out').textContent = '요약 실패';
            }
        });

        // 4) 질의
        $('#dm-ask').addEventListener('click', async () => {
            const id = $('#dm-docId').value?.trim();
            const q  = $('#dm-q').value?.trim();
            if (!id || !q) return alert('문서 ID와 질문을 입력하세요.');
            $('#dm-ask-out').textContent = '질의 중...';
            try {
                const res = await askDocument(id, q);
                $('#dm-ask-out').textContent = res.answer ?? '(응답 없음)';
            } catch (e) {
                console.error(e);
                $('#dm-ask-out').textContent = '질의 실패';
            }
        });

        // 초기 로드
        renderList();
    }
};

export default DocuMindPage;
