// resources/static/app/pages/sms/sms-share.page.js
// 📤 안드로이드 '공유하기'로 받은 카드 문자 → 확인 대기함에 넣고 캘린더에서 바로 열기
//   (/share?text=... → 서버가 #/sms-share?text=... 로 넘겨줌)

import { escapeHtml } from '../../ui/modal.js';

export default function SmsSharePage() {
    const params = new URLSearchParams(location.hash.split('?')[1] || '');
    const text = params.get('text') || '';

    return {
        title: '카드 문자 입력',

        render() {
            return `
            <section class="ledger-page">
                <div class="card" style="text-align:center;">
                    <h2 class="title">📩 카드 문자 읽는 중…</h2>
                    <p class="subtitle" id="smsShareMsg">잠시만 기다려주세요.</p>
                </div>
            </section>`;
        },

        async onMounted() {
            const msg = document.getElementById('smsShareMsg');
            if (!text.trim()) {
                msg.textContent = '공유받은 내용이 없어요.';
                return;
            }
            try {
                const { data: r } = await axios.post('/api/sms/inbox/paste', { text });
                if (!r.pending && !r.duplicate) {
                    msg.innerHTML = `카드 결제 문자를 찾지 못했어요.<br><small class="hint">${escapeHtml(text.slice(0, 120))}</small>`;
                    return;
                }
                // 캘린더로 가서 확인 대기함 열기 (주소에 문자를 남기지 않도록 replace)
                location.replace('#/calendar?inbox=1');
            } catch (err) {
                msg.textContent = err.response?.data?.message || '읽지 못했어요. 잠시 후 다시 시도해주세요.';
            }
        }
    };
}
