package com.growtive.documind.service;

import com.growtive.documind.mapper.DocumentMapper;
import com.growtive.documind.mapper.QaMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class QaService {
    private final DocumentMapper docMapper;
    private final QaMapper qaMapper;
    private final OpenAiClient openAi;

    @Transactional
    public com.growtive.documind.dto.QaLogDto ask(Long docId, String question){
        var d = docMapper.findById(docId);
        if (d == null) throw new IllegalArgumentException("문서 없음");

        String prompt = "다음 문서 내용을 바탕으로 질문에 한국어로 답하고, 근거 문장도 인용해줘.\n"
                + "문서:\n" + d.getContent() + "\n\n질문: " + question;
        String answer = openAi.complete(prompt);

        var qa = com.growtive.documind.model.QaLog.builder()
                .documentId(docId).question(question).answer(answer).build();
        qaMapper.insert(qa);

        return com.growtive.documind.dto.QaLogDto.builder()
                .id(qa.getId()).question(qa.getQuestion()).answer(qa.getAnswer()).build();
    }
}