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
