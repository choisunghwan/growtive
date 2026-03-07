package com.growtive.money.mapper;

import com.growtive.money.dto.CashFlowPointDto;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

@Mapper
public interface FinancialCashFlowMapper {

    List<CashFlowPointDto> findCashFlowSeries(
            @Param("userId") String userId,
            @Param("startYear") int startYear,
            @Param("startMonth") int startMonth,
            @Param("months") int months
    );
}