package com.growtive.money.service;

import com.growtive.money.dto.FinancialNodeTemplateDto;

import java.util.List;

public interface FinancialTemplateService {

    List<FinancialNodeTemplateDto> getTemplates(Long userId);

    FinancialNodeTemplateDto createTemplate(Long userId, FinancialNodeTemplateDto dto);

    FinancialNodeTemplateDto updateTemplate(Long userId, Long id, FinancialNodeTemplateDto dto);

    void deleteTemplate(Long userId, Long id);
}