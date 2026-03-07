package com.growtive.money.mapper;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

@Mapper
public interface FinancialSummaryMapper {

    Long sumIncome(@Param("userId") Long userId,
                   @Param("year") int year,
                   @Param("month") int month);

    Long sumExpense(@Param("userId") Long userId,
                    @Param("year") int year,
                    @Param("month") int month);

    Long sumAssetInvestment(@Param("userId") Long userId,
                            @Param("year") int year,
                            @Param("month") int month);
}