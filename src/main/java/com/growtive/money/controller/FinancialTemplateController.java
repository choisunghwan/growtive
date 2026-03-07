package com.growtive.money.controller;

import com.growtive.money.dto.FinancialNodeTemplateDto;
import com.growtive.money.service.FinancialTemplateService;
import jakarta.servlet.http.HttpSession;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/money")
@RequiredArgsConstructor
public class FinancialTemplateController {

    private final FinancialTemplateService service;

    private Long getUserId(HttpSession session) {
        Long userId = (Long) session.getAttribute("userId");
        if (userId == null) {
            throw new RuntimeException("로그인이 필요합니다.");
        }
        return userId;
    }

    /**
     * 템플릿 목록 조회
     */
    @GetMapping("/templates")
    public List<FinancialNodeTemplateDto> getTemplates(HttpSession session) {
        Long userId = getUserId(session);
        return service.getTemplates(userId);
    }

    /**
     * 템플릿 생성
     */
    @PostMapping("/templates")
    public FinancialNodeTemplateDto createTemplate(
            @RequestBody FinancialNodeTemplateDto dto,
            HttpSession session
    ) {
        Long userId = getUserId(session);
        return service.createTemplate(userId, dto);
    }

    /**
     * 템플릿 수정
     */
    @PutMapping("/templates/{id}")
    public FinancialNodeTemplateDto updateTemplate(
            @PathVariable Long id,
            @RequestBody FinancialNodeTemplateDto dto,
            HttpSession session
    ) {
        Long userId = getUserId(session);
        return service.updateTemplate(userId, id, dto);
    }

    /**
     * 템플릿 삭제
     */
    @DeleteMapping("/templates/{id}")
    public void deleteTemplate(
            @PathVariable Long id,
            HttpSession session
    ) {
        Long userId = getUserId(session);
        service.deleteTemplate(userId, id);
    }
}