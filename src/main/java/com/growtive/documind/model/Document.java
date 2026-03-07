package com.growtive.documind.model;
import lombok.*;

import java.time.LocalDateTime;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class Document {
    private Long id;
    private String title;
    private String filePath;
    private String content;
    private LocalDateTime createdAt;
}
