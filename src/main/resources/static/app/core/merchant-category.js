// resources/static/app/core/merchant-category.js
// 🏷️ 가맹점 이름으로 카테고리 추측 (영수증 읽기용 — 서버 카드 문자 해석(SmsParser)과 같은 표)

const CATEGORY_KEYWORDS = {
    '카페': ['스타벅스', '투썸', '이디야', '메가', '컴포즈', '빽다방', '폴바셋', '할리스', '커피', '카페', '블루보틀', '공차', '베이커리', '파리바게뜨', '뚜레쥬르', '던킨', '배스킨', 'STARBUCKS', 'COFFEE', 'CAFE'],
    '교통': ['카카오T', '카카오 T', '택시', '티머니', '버스', '지하철', '코레일', 'KTX', 'SRT', '주유', 'SK에너지', 'GS칼텍스', 'S-OIL', '에스오일', '현대오일', '주차', '하이패스', '쏘카'],
    '쇼핑': ['쿠팡', '11번가', 'G마켓', '지마켓', '옥션', '무신사', '올리브영', '다이소', 'SSG', '신세계', '롯데백화점', '현대백화점', '유니클로', '자라', '이케아', 'DAISO', 'OLIVE'],
    '식비': ['이마트', '홈플러스', '롯데마트', '코스트코', '마트', 'GS25', 'CU', '세븐일레븐', '이마트24', '편의점', '배달의민족', '배민', '요기요', '쿠팡이츠', '맥도날드', '버거킹', '롯데리아', '맘스터치', 'KFC', '식당', '치킨', '피자', '김밥', '분식', '국밥', '고기', '푸드', '반점', '갈비', '횟집', 'EMART', 'HOMEPLUS', 'MART'],
    '문화': ['CGV', '메가박스', '롯데시네마', '교보문고', '예스24', '알라딘', '티켓', '인터파크', '서점', '노래', 'PC방'],
    '의료': ['병원', '의원', '약국', '치과', '한의원', '안과', '피부과', '정형외과', '내과'],
};

export function guessCategory(merchant) {
    if (!merchant) return '기타';
    const m = merchant.toUpperCase();
    for (const [cat, words] of Object.entries(CATEGORY_KEYWORDS)) {
        if (words.some(w => m.includes(w.toUpperCase()))) return cat;
    }
    return '기타';
}
