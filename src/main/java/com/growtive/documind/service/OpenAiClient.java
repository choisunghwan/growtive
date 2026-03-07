package com.growtive.documind.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;

import java.util.List;
import java.util.Map;

/**
 * OpenAI API 호출 담당 클라이언트
 * - SummaryService, QaService 에서 사용
 * - 간단하게 /v1/chat/completions 엔드포인트 호출
 */
@Component
@Slf4j
public class OpenAiClient {

    @Value("${documind.openai.api-key}")
    private String apiKey;

    /**
     * 모델 이름은 properties에서 바꿀 수 있게 해둠.
     * 예: gpt-4.1-mini, gpt-4o-mini 등
     */
    @Value("${documind.openai.model:gpt-4.1-mini}")
    private String model;

    // 간단하게 new RestTemplate() 사용
    private final RestTemplate restTemplate = new RestTemplate();

    /**
     * 주어진 prompt를 OpenAI에 보내서 한 번의 응답 텍스트를 받아온다.
     */
    public String complete(String prompt) {
        // OpenAI Chat Completions 엔드포인트
        String url = "https://api.openai.com/v1/chat/completions";

        // 요청 바디 (아주 심플 버전)
        Map<String, Object> body = Map.of(
                "model", model,
                "messages", List.of(
                        Map.of(
                                "role", "user",
                                "content", prompt
                        )
                ),
                "max_tokens", 512
        );

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setBearerAuth(apiKey);

        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(body, headers);

        try {
            ResponseEntity<Map> response = restTemplate.postForEntity(url, entity, Map.class);

            if (!response.getStatusCode().is2xxSuccessful()) {
                log.error("OpenAI 호출 실패. status={}, body={}", response.getStatusCode(), response.getBody());
                throw new RuntimeException("OpenAI HTTP 오류: " + response.getStatusCode());
            }

            Map<String, Object> resBody = response.getBody();
            if (resBody == null) {
                throw new RuntimeException("OpenAI 응답 body가 null입니다.");
            }

            // choices[0].message.content 에서 텍스트 꺼내기
            List<Map<String, Object>> choices = (List<Map<String, Object>>) resBody.get("choices");
            if (choices == null || choices.isEmpty()) {
                throw new RuntimeException("OpenAI 응답에 choices가 없습니다.");
            }

            Map<String, Object> first = choices.get(0);
            Map<String, Object> message = (Map<String, Object>) first.get("message");
            if (message == null) {
                throw new RuntimeException("OpenAI 응답에 message가 없습니다.");
            }

            Object contentObj = message.get("content");
            if (contentObj == null) {
                throw new RuntimeException("OpenAI 응답에 content가 없습니다.");
            }

            String content = contentObj.toString();
            log.debug("OpenAI 응답 요약: {}", content);
            return content;

        } catch (RestClientException e) {
            log.error("OpenAI 호출 중 예외 발생", e);
            throw new RuntimeException("OpenAI 호출 실패", e);
        }
    }
}
