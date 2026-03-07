package com.growtive.documind.web;

import com.growtive.documind.dto.DocumentDetailDto;
import com.growtive.documind.dto.DocumentDto;
import com.growtive.documind.dto.QaLogDto;
import com.growtive.documind.dto.QaRequest;
import com.growtive.documind.dto.SummaryDto;
import com.growtive.documind.service.DocumentService;
import com.growtive.documind.service.QaService;
import com.growtive.documind.service.SummaryService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

/**
 * 📘 DocumentController
 *  - DocuMind(문서 요약/Q&A) 모듈의 REST API 진입점
 *  - URL prefix: /api/docs
 *  - 역할:
 *      • 파일 업로드 → 텍스트 추출 → 문서 저장
 *      • 문서 요약 생성
 *      • 문서 기준 Q&A 수행
 *      • 문서 목록/상세 조회 (요약/QA 로그 포함)
 */
@RestController
@RequestMapping("/api/docs")
@RequiredArgsConstructor
@Validated
public class DocumentController {

    // Service 계층 (비즈니스 로직, 트랜잭션, 예외 처리)
    private final DocumentService documentService;
    private final SummaryService summaryService;
    private final QaService qaService;

    /**
     * 📥 파일 업로드 → 텍스트 추출 → document 테이블 저장
     * - multipart/form-data 로 파일 전송
     * - 성공 시: DocumentDto(id, title, filePath 등) 반환
     *
     * curl 예:
     * curl -F "file=@/path/to/file.pdf" http://localhost:8080/api/docs/upload
     */
    @PostMapping(value = "/upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public DocumentDto upload(@RequestParam("file") MultipartFile file) {
        return documentService.uploadAndExtract(file);
    }

    /**
     * 📝 문서 요약 생성 (OpenAI 호출)
     * - 경로 변수: 문서 ID
     * - 성공 시: SummaryDto(요약 텍스트, id 등) 반환
     *
     * curl 예:
     * curl -X POST http://localhost:8080/api/docs/1/summarize
     */
    @PostMapping("/{id}/summarize")
    public SummaryDto summarize(@PathVariable Long id) {
        return summaryService.summarize(id);
    }

    /**
     * ❓ 문서 Q&A (질문 → 답변 생성 + 로그 저장)
     * - RequestBody: { "question": "..." }
     * - 성공 시: QaLogDto(질문/답변/시간 등) 반환
     *
     * curl 예:
     * curl -X POST -H "Content-Type: application/json" \
     *   -d '{"question":"주요 결론이 뭐야?"}' \
     *   http://localhost:8080/api/docs/1/ask
     */
    @PostMapping("/{id}/ask")
    public QaLogDto ask(@PathVariable Long id, @Valid @RequestBody QaRequest req) {
        return qaService.ask(id, req.getQuestion());
    }

    /**
     * 📚 문서 목록 조회 (최신순 권장)
     * - 리스트 화면에서 업로드 이력/제목 확인용
     *
     * curl 예:
     * curl http://localhost:8080/api/docs
     */
    @GetMapping
    public List<DocumentDto> list() {
        return documentService.list();
    }

    /**
     * 🔎 문서 상세 조회
     * - 본문(content) + 요약 목록 + Q&A 로그를 한 번에 제공
     * - 상세 화면/우측 패널 등에 사용
     *
     * curl 예:
     * curl http://localhost:8080/api/docs/1
     */
    @GetMapping("/{id}")
    public DocumentDetailDto detail(@PathVariable Long id) {
        return documentService.detail(id);
    }

    @DeleteMapping("/{id}")
    public void delete(@PathVariable Long id) {
        documentService.delete(id);
    }

}

