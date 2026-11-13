// 아주 가벼운 확인 모달. 사용법: if (await confirmModal('지울까요?')) { ... }
export function confirmModal(message = '계속하시겠습니까?') {
    return new Promise((resolve) => {
        let wrap = document.createElement('div');
        wrap.className = 'modal-wrap';
        wrap.innerHTML = `
      <div class="modal-dim"></div>
      <div class="modal">
        <div class="modal-title">확인</div>
        <div class="modal-body">${message}</div>
        <div class="modal-actions">
          <button id="mCancel" class="btn btn-ghost">취소</button>
          <button id="mOk" class="btn btn-danger">확인</button>
        </div>
      </div>
    `;
        document.body.appendChild(wrap);
        const close = (v)=>{ wrap.remove(); resolve(v); };
        wrap.querySelector('#mCancel').onclick = () => close(false);
        wrap.querySelector('#mOk').onclick = () => close(true);
        wrap.querySelector('.modal-dim').onclick = () => close(false);
    });
}


/** HTML에 넣을 문자열 이스케이프 */
export function escapeHtml(s) {
    return String(s ?? '').replace(/[&<>"']/g, c => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[c]));
}

/* ---------------- 모달 (겹쳐 띄우기 가능) ---------------- */

/**
 * 모달을 띄우고 { el, close } 를 돌려준다. 나중에 띄운 모달이 위에 쌓인다.
 * 바깥(어두운 영역) 클릭 / Esc 로 닫힘 → onClose 호출
 */
export function openModal({ title, bodyHtml, actionsHtml, className = '', onClose }) {
    const wrap = document.createElement('div');
    wrap.className = 'modal-wrap';
    wrap.innerHTML = `
        <div class="modal-dim"></div>
        <div class="modal history-modal ${className}" role="dialog" aria-modal="true" aria-label="${escapeHtml(title)}">
            <div class="history-modal-head">
                <div class="modal-title">${escapeHtml(title)}</div>
                <button type="button" class="history-modal-x" data-modal-close aria-label="닫기">✕</button>
            </div>
            <div class="history-modal-body">${bodyHtml}</div>
            ${actionsHtml ? `<div class="modal-actions">${actionsHtml}</div>` : ''}
        </div>`;
    document.body.appendChild(wrap);

    let closed = false;
    const onKey = (e) => {
        // 맨 위 모달만 Esc에 반응
        if (e.key === 'Escape' && document.querySelector('.modal-wrap:last-of-type') === wrap) close();
    };
    function close() {
        if (closed) return;
        closed = true;
        document.removeEventListener('keydown', onKey);
        window.removeEventListener('hashchange', close);
        wrap.remove();
        onClose?.();
    }
    wrap.querySelector('.modal-dim').addEventListener('click', close);
    wrap.querySelectorAll('[data-modal-close]').forEach(b => b.addEventListener('click', close));
    document.addEventListener('keydown', onKey);
    // 화면이 바뀌면(뒤로 가기, 메뉴 이동) 열려 있던 모달은 닫음
    window.addEventListener('hashchange', close);
    return { el: wrap, close };
}
