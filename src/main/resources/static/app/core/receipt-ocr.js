// resources/static/app/core/receipt-ocr.js
// 📷 영수증 읽기 — 휴대폰(브라우저) 안에서만 글자를 읽는다 (Tesseract.js)
//  - 사진은 서버로 보내지 않고, 읽은 뒤 바로 버린다 (메모리의 이미지·캔버스 정리)
//  - 처음 한 번 읽기 프로그램(약 5MB)을 받아오고, 이후엔 브라우저에 남아 빨라진다
//  - 결과: { amount, merchant, date('YYYY-MM-DD' | null), category }

import { guessCategory } from './merchant-category.js';

const TESS_VER = '5.1.1';
const CDN = 'https://cdn.jsdelivr.net/npm';
const PATHS = {
    script: `${CDN}/tesseract.js@${TESS_VER}/dist/tesseract.min.js`,
    workerPath: `${CDN}/tesseract.js@${TESS_VER}/dist/worker.min.js`,
    corePath: `${CDN}/tesseract.js-core@${TESS_VER}`,
    // 언어 데이터는 기본 경로 사용: @tesseract.js-data/kor·eng 의 작은 모델(best_int)
};

let scriptPromise = null;
function loadTesseract() {
    if (window.Tesseract) return Promise.resolve(window.Tesseract);
    scriptPromise ||= new Promise((resolve, reject) => {
        const s = document.createElement('script');
        s.src = PATHS.script;
        s.onload = () => (window.Tesseract ? resolve(window.Tesseract) : reject(new Error('Tesseract 없음')));
        s.onerror = () => { scriptPromise = null; reject(new Error('읽기 프로그램을 불러오지 못했어요.')); };
        document.head.appendChild(s);
    });
    return scriptPromise;
}

/** 사진 → 흑백·적당한 크기 캔버스 (읽기 정확도↑, 메모리↓) */
async function toCanvas(file) {
    const url = URL.createObjectURL(file);
    try {
        const img = await new Promise((resolve, reject) => {
            const i = new Image();
            i.onload = () => resolve(i);
            i.onerror = () => reject(new Error('사진을 열 수 없어요.'));
            i.src = url;
        });
        const scale = Math.min(1, 1800 / Math.max(img.naturalWidth, img.naturalHeight));
        const w = Math.round(img.naturalWidth * scale), h = Math.round(img.naturalHeight * scale);
        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        ctx.drawImage(img, 0, 0, w, h);
        const data = ctx.getImageData(0, 0, w, h);
        const px = data.data;
        for (let i = 0; i < px.length; i += 4) {
            // 흑백 + 대비 살짝 올리기
            let g = 0.299 * px[i] + 0.587 * px[i + 1] + 0.114 * px[i + 2];
            g = Math.max(0, Math.min(255, (g - 128) * 1.35 + 128));
            px[i] = px[i + 1] = px[i + 2] = g;
        }
        ctx.putImageData(data, 0, 0);
        img.src = '';
        return canvas;
    } finally {
        URL.revokeObjectURL(url); // 원본 사진은 바로 버림
    }
}

/**
 * 영수증 사진 읽기
 * @param {File} file
 * @param {(percent:number, stage:string)=>void} [onProgress]
 */
export async function readReceipt(file, onProgress) {
    const Tesseract = await loadTesseract();
    onProgress?.(0, '준비 중');
    const canvas = await toCanvas(file);
    const worker = await Tesseract.createWorker(['kor', 'eng'], 1, {
        workerPath: PATHS.workerPath,
        corePath: PATHS.corePath,
        logger: (m) => {
            if (m.status === 'recognizing text') onProgress?.(Math.round(m.progress * 100), '글자 읽는 중');
            else if (/loading/.test(m.status)) onProgress?.(0, '읽기 프로그램 받는 중');
        },
    });
    try {
        const { data } = await worker.recognize(canvas);
        return { text: data.text || '', ...parseReceipt(data.text || '') };
    } finally {
        await worker.terminate();
        canvas.width = canvas.height = 0; // 캔버스 메모리 정리
    }
}

/* ---------------- 글자 → 금액·가맹점·날짜 ---------------- */

const AMOUNT_KEYS = ['결제금액', '받을금액', '합계금액', '총합계', '합계', '총액', '총금액', '승인금액', '청구금액', '판매금액', '카드결제', '신용카드', '결제'];
const NOT_AMOUNT_KEYS = ['부가세', '부가가치세', '과세', '면세', '세액', '공급가', '봉사료', '거스름', '받은돈', '받은금액', '현금', '할인', '포인트', '잔액', '사업자', '전화', 'TEL', '번호', '카드번호', '승인번호'];

function cleanNumber(s) {
    const n = Number(String(s).replace(/[^\d]/g, ''));
    return Number.isFinite(n) ? n : 0;
}

/** 줄에서 금액 같은 숫자들 (12,000 / 12000원 / 12.000) */
function amountsIn(line) {
    const out = [];
    const re = /(\d{1,3}(?:[,.]\d{3})+|\d{3,8})\s*원?/g;
    let m;
    while ((m = re.exec(line))) {
        const n = cleanNumber(m[1]);
        if (n >= 100 && n <= 50_000_000) out.push(n);
    }
    return out;
}

export function parseReceipt(text) {
    const lines = text.split(/\n/).map(l => l.replace(/\s+/g, ' ').trim()).filter(Boolean);
    const compact = (l) => l.replace(/\s/g, '');

    // 금액: '결제금액/합계' 같은 줄의 숫자 (뒤쪽에 나오는 것 우선), 없으면 가장 큰 금액
    let amount = null;
    for (const key of AMOUNT_KEYS) {
        for (let i = lines.length - 1; i >= 0 && amount == null; i--) {
            const c = compact(lines[i]);
            if (!c.includes(key) || NOT_AMOUNT_KEYS.some(k => c.includes(k) && !c.includes(key + '금액'))) continue;
            const nums = amountsIn(lines[i]).length ? amountsIn(lines[i]) : amountsIn(lines[i + 1] || '');
            if (nums.length) amount = Math.max(...nums);
        }
        if (amount != null) break;
    }
    if (amount == null) {
        const all = lines.filter(l => !NOT_AMOUNT_KEYS.some(k => compact(l).includes(k))).flatMap(amountsIn);
        if (all.length) amount = Math.max(...all);
    }

    // 날짜: 2026-11-14 / 2026.11.14 / 26/11/14 / 2026년 11월 14일
    // (사업자번호 123-45-67890 같은 숫자는 건너뛰고 달·일이 맞는 첫 번째)
    let date = null;
    for (const dm of text.matchAll(/(?<!\d)(20\d{2}|\d{2})\s*[-./년]\s*(\d{1,2})\s*[-./월]\s*(\d{1,2})(?!\d)/g)) {
        const y = dm[1].length === 2 ? 2000 + Number(dm[1]) : Number(dm[1]);
        const mo = Number(dm[2]), d = Number(dm[3]);
        if (mo >= 1 && mo <= 12 && d >= 1 && d <= 31 && y >= 2000 && y <= 2099) {
            date = `${y}-${String(mo).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
            break;
        }
    }

    // 가맹점: '상호/가맹점/매장명:' 표시가 있으면 그것, 없으면 위쪽에서 숫자·안내 문구가 아닌 첫 줄
    let merchant = null;
    for (const l of lines) {
        const m = l.match(/(?:상\s*호|가\s*맹\s*점\s*명?|매\s*장\s*명|점\s*포\s*명)\s*[:：]?\s*(.+)/);
        if (m && m[1].replace(/[\d\s\-()]/g, '').length >= 2) { merchant = m[1]; break; }
    }
    if (!merchant) {
        const skip = /영수증|receipt|사업자|대표|주소|전화|tel|fax|번호|일시|날짜|날자|거래|매출|카드|승인|단말|pos|no\.|\*{2,}|http|www/i;
        merchant = lines.slice(0, 8).find(l => !skip.test(l) && /[가-힣A-Za-z]{2,}/.test(l) && (l.match(/\d/g) || []).length <= l.length / 3) || null;
    }
    if (merchant) merchant = merchant.replace(/[|_~^`"'<>]/g, ' ').replace(/\s{2,}/g, ' ').trim().slice(0, 40);

    return { amount, merchant, date, category: guessCategory(merchant) };
}
