package com.growtive.documind.service;

import com.growtive.documind.dto.*;
import com.growtive.documind.mapper.*;
import com.growtive.documind.model.*;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.nio.file.*;
import java.util.*;

/**
 * 📘 문서 관련 비즈니스 로직(Service)
 *  - Controller ↔ Mapper 사이의 중간 계층
 *  - DB 트랜잭션 관리, 예외 처리, 비즈니스 규칙 적용
 */
@Service
@RequiredArgsConstructor
public class DocumentService {

    private final DocumentMapper docMapper;   // DB 접근용 MyBatis Mapper
    private final SummaryMapper sumMapper;    // 요약 테이블 Mapper
    private final QaMapper qaMapper;          // Q&A 테이블 Mapper
    private final TextExtractor extractor;    // Apache Tika 텍스트 추출기

    @Value("${documind.storage-dir}")
    private String storageDir; // application.yml에서 지정한 업로드 폴더 경로

    /**
     * 파일 업로드 후 텍스트 추출 및 DB 저장
     */
    @Transactional
    public DocumentDto uploadAndExtract(MultipartFile file) {
        try {
            // 1️⃣ 업로드 폴더 없으면 생성
            Files.createDirectories(Path.of(storageDir));

            // 2️⃣ 저장 파일명: UUID + 원래파일명
            String stored = UUID.randomUUID() + "_" + file.getOriginalFilename();
            Path path = Path.of(storageDir, stored);

            // 3️⃣ 실제 파일 저장
            file.transferTo(path.toFile());

            // 4️⃣ Apache Tika로 파일 내용을 텍스트로 변환
            String content = extractor.extract(Files.newInputStream(path));

            // 5️⃣ DB에 insert할 Document 객체 생성
            Document doc = Document.builder()
                    .title(file.getOriginalFilename())
                    .filePath(path.toString())
                    .content(content)
                    .build();

            // 6️⃣ MyBatis Mapper를 통해 DB에 insert
            docMapper.insert(doc);

            // 7️⃣ 저장 후 생성된 PK(id)가 doc 객체에 자동 세팅됨
            return DocumentDto.of(doc);

        } catch (Exception e) {
            throw new RuntimeException("파일 업로드/추출 실패", e);
        }
    }

    /**
     * 모든 문서 리스트 조회
     */
    @Transactional(readOnly = true)
    public List<DocumentDto> list() {
        return docMapper.findAll().stream()
                .map(DocumentDto::of)
                .toList();
    }

    /**
     * 문서 상세 조회 (요약/질문 포함)
     */
    @Transactional(readOnly = true)
    public DocumentDetailDto detail(Long id) {
        Document d = docMapper.findById(id);
        if (d == null)
            throw new IllegalArgumentException("문서 없음");

        // 요약 목록
        var sums = sumMapper.findByDocumentId(id).stream()
                .map(s -> SummaryDto.builder()
                        .id(s.getId())
                        .summaryText(s.getSummaryText())
                        .build())
                .toList();

        // Q&A 목록
        var qas = qaMapper.findByDocumentId(id).stream()
                .map(q -> QaLogDto.builder()
                        .id(q.getId())
                        .question(q.getQuestion())
                        .answer(q.getAnswer())
                        .build())
                .toList();

        // 모든 걸 DocumentDetailDto로 합쳐서 반환
        return DocumentDetailDto.builder()
                .id(d.getId())
                .title(d.getTitle())
                .content(d.getContent())
                .summaries(sums)
                .qaLogs(qas)
                .build();
    }


    @Transactional
    public void delete(Long id) {
        // 1) 자식 테이블(요약, Q&A) 먼저 삭제
        sumMapper.deleteByDocumentId(id);
        qaMapper.deleteByDocumentId(id);

        // 2) 마지막으로 문서 삭제
        docMapper.delete(id);
    }


}
