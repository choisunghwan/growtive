package com.growtive.documind.service;

import org.apache.tika.Tika;
import org.springframework.stereotype.Component;
import java.io.InputStream;

/**
 * 📘 TextExtractor (텍스트 추출기)
 *  - Apache Tika를 이용해 PDF, HWP, DOCX, PPTX, TXT 등 다양한 문서에서
 *    텍스트 내용을 자동으로 추출하는 유틸리티 컴포넌트.
 *
 * 🔹 주요 역할
 *   1) 파일 InputStream을 받아서
 *   2) Apache Tika의 parseToString()으로 본문 텍스트 추출
 *   3) 추출된 텍스트를 문자열(String)로 반환
 *
 * 🔹 사용 위치
 *   - DocumentService.uploadAndExtract(MultipartFile) 내부에서 사용됨
 *   - 실제로 파일을 저장한 후 텍스트를 추출할 때 호출됨
 *
 * 🔹 참고
 *   - Apache Tika는 파일 확장자를 자동 인식해서 내부적으로 파서 선택
 *   - 별도 설정 없이도 한글(HWP)·PDF·Word·Excel 등 대부분의 포맷을 지원
 */

@Component // Spring이 Bean으로 등록해줌 (DI 가능)
public class TextExtractor {

    /**
     * 🧾 extract() : 파일에서 텍스트를 추출하는 메서드
     *
     * @param in 파일 입력 스트림 (MultipartFile.getInputStream() 등으로 전달)
     * @return 추출된 텍스트 (String)
     */
    public String extract(InputStream in) {
        try (in) {
            // 1️⃣ Apache Tika 인스턴스 생성
            Tika tika = new Tika();

            // 2️⃣ 파일 내용을 텍스트로 파싱
            //     - 내부적으로 MIME 타입을 자동 감지하고 적절한 Parser 사용
            //     - PDF → 텍스트, HWP → 한글 텍스트 등으로 변환
            return tika.parseToString(in);

        } catch (Exception e) {
            // 3️⃣ 실패 시 런타임 예외 던짐 → 상위 서비스에서 잡거나 로깅 처리
            throw new RuntimeException("텍스트 추출 실패", e);
        }
    }
}
