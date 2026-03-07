package com.growtive.money.service;

import com.growtive.money.dto.FinancialNodeTemplateDto;
import com.growtive.money.mapper.FinancialTemplateMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.YearMonth;
import java.util.List;

@Service
@RequiredArgsConstructor
public class FinancialTemplateServiceImpl implements FinancialTemplateService {

    private final FinancialTemplateMapper mapper;

    @Override
    public List<FinancialNodeTemplateDto> getTemplates(String userId) {
        return mapper.findTemplatesByUser(userId);
    }

    @Override
    @Transactional
    public FinancialNodeTemplateDto createTemplate(String userId, FinancialNodeTemplateDto dto) {

        dto.setId(null);
        dto.setUserId(userId);

        if (dto.getDefaultMonthlyAmount() == null) {
            dto.setDefaultMonthlyAmount(0L);
        }
        if (dto.getDefaultExpectedReturn() == null) {
            dto.setDefaultExpectedReturn(BigDecimal.ZERO);
        }

        mapper.insertTemplate(dto);

        YearMonth now = YearMonth.now();

        mapper.insertSnapshotFromTemplateIfNotExists(
                userId,
                dto.getId(),
                now.getYear(),
                now.getMonthValue()
        );

        // 🔥 자동 flow 생성
        autoGenerateFlows(userId);

        // 🔥 snapshot flow 재생성
        regenerateCurrentMonthFlows(userId);

        return dto;
    }

    @Override
    @Transactional
    public FinancialNodeTemplateDto updateTemplate(String userId, Long id, FinancialNodeTemplateDto dto) {

        dto.setId(id);
        dto.setUserId(userId);

        if (dto.getDefaultMonthlyAmount() == null) {
            dto.setDefaultMonthlyAmount(0L);
        }
        if (dto.getDefaultExpectedReturn() == null) {
            dto.setDefaultExpectedReturn(BigDecimal.ZERO);
        }

        mapper.updateTemplate(dto);

        YearMonth now = YearMonth.now();

        mapper.updateCurrentMonthSnapshotFromTemplate(
                userId,
                id,
                now.getYear(),
                now.getMonthValue(),
                dto.getDefaultMonthlyAmount(),
                dto.getDefaultExpectedReturn()
        );

        autoGenerateFlows(userId);
        regenerateCurrentMonthFlows(userId);

        return dto;
    }

    @Override
    @Transactional
    public void deleteTemplate(String userId, Long id) {

        mapper.deleteTemplate(id, userId);

        autoGenerateFlows(userId);
        regenerateCurrentMonthFlows(userId);
    }

    // =====================================================
    // 🔥 자동 flow_template 생성
    // =====================================================

    private void autoGenerateFlows(String userId) {

        List<FinancialNodeTemplateDto> templates =
                mapper.findTemplatesByUser(userId);

        FinancialNodeTemplateDto income = null;

        for (FinancialNodeTemplateDto t : templates) {
            if ("INCOME".equals(t.getType())) {
                income = t;
                break;
            }
        }

        if (income == null) return;

        mapper.deleteAllFlowTemplates(userId);

        for (FinancialNodeTemplateDto t : templates) {

            if (!"INCOME".equals(t.getType())) {

                mapper.insertFlowTemplate(
                        userId,
                        income.getId(),
                        t.getId(),
                        t.getDefaultMonthlyAmount()
                );
            }
        }
    }

    // =====================================================
    // 🔥 snapshot flow 재생성
    // =====================================================

    private void regenerateCurrentMonthFlows(String userId) {

        YearMonth now = YearMonth.now();

        mapper.deleteCurrentMonthFlows(
                userId,
                now.getYear(),
                now.getMonthValue()
        );

        mapper.insertCurrentMonthFlowsFromTemplate(
                userId,
                now.getYear(),
                now.getMonthValue()
        );
    }
}