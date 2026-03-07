package com.growtive.money.mapper;

import com.growtive.money.dto.FinancialNodeTemplateDto;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.math.BigDecimal;
import java.util.List;

@Mapper
public interface FinancialTemplateMapper {

    List<FinancialNodeTemplateDto> findTemplatesByUser(
            @Param("userId") Long userId);

    void insertTemplate(FinancialNodeTemplateDto template);

    void updateTemplate(FinancialNodeTemplateDto template);

    void deleteTemplate(@Param("id") Long id,
                        @Param("userId") Long userId);

    void updateCurrentMonthSnapshotFromTemplate(
            @Param("userId") Long userId,
            @Param("templateId") Long templateId,
            @Param("year") int year,
            @Param("month") int month,
            @Param("monthlyAmount") Long monthlyAmount,
            @Param("expectedReturn") BigDecimal expectedReturn
    );

    void insertSnapshotFromTemplateIfNotExists(
            @Param("userId") Long userId,
            @Param("templateId") Long templateId,
            @Param("year") int year,
            @Param("month") int month
    );

    void deleteCurrentMonthSnapshot(
            @Param("userId") Long userId,
            @Param("templateId") Long templateId,
            @Param("year") int year,
            @Param("month") int month
    );

    void deleteCurrentMonthFlows(
            @Param("userId") Long userId,
            @Param("year") int year,
            @Param("month") int month
    );

    void insertCurrentMonthFlowsFromTemplate(
            @Param("userId") Long userId,
            @Param("year") int year,
            @Param("month") int month
    );

    // 🔥 자동 flow 생성용
    void deleteAllFlowTemplates(@Param("userId") Long userId);

    void insertFlowTemplate(@Param("userId") Long userId,
                            @Param("fromId") Long fromId,
                            @Param("toId") Long toId,
                            @Param("amount") Long amount);
}