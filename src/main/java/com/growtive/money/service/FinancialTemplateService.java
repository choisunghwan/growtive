package com.growtive.money.service;

import com.growtive.money.dto.FinancialNodeTemplateDto;

import java.util.List;

public interface FinancialTemplateService {

    List<FinancialNodeTemplateDto> getTemplates(String userId);

    FinancialNodeTemplateDto createTemplate(String userId, FinancialNodeTemplateDto dto);

    FinancialNodeTemplateDto updateTemplate(String userId, Long id, FinancialNodeTemplateDto dto);

    void deleteTemplate(String userId, Long id);
}