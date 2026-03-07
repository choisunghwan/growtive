package com.growtive.documind.service;

import com.growtive.documind.mapper.DocumentMapper;
import com.growtive.documind.mapper.SummaryMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class SummaryService {
    private final DocumentMapper docMapper;
    private final SummaryMapper sumMapper;
    private final OpenAiClient openAi;

    @Transactional
    public com.growtive.documind.dto.SummaryDto summarize(Long docId){
        var d = docMapper.findById(docId);
        if (d == null) throw new IllegalArgumentException("문서 없음");

        String prompt = "다음 문서를 5문장 이내 핵심 bullet로 한국어 요약:\n\n" + d.getContent();
        String text = openAi.complete(prompt);

        var s = com.growtive.documind.model.Summary.builder()
                .documentId(docId).summaryText(text).build();
        sumMapper.insert(s);

        return com.growtive.documind.dto.SummaryDto.builder()
                .id(s.getId()).summaryText(s.getSummaryText()).build();
    }
}
