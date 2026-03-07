package com.growtive.documind.dto;

import com.growtive.documind.model.Document;
import lombok.*;

import java.time.LocalDateTime;

@Data @Builder
public class DocumentDto {
    private Long id;              // 문서 ID
    private String title;         // 제목
    private String filePath;      // 파일 경로 (필요하면 유지)
    private LocalDateTime createdAt; // 🔥 생성일(프론트에서 쓰는 값)
    public static DocumentDto of(Document d){
        return DocumentDto.builder()
                .id(d.getId())
                .title(d.getTitle())
                .filePath(d.getFilePath())
                .createdAt(d.getCreatedAt())
                .build();
    }
}