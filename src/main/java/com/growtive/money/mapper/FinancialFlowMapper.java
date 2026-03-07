package com.growtive.money.mapper;

import com.growtive.money.dto.FlowLinkDto;
import com.growtive.money.dto.FlowNodeDto;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

@Mapper
public interface FinancialFlowMapper {

    List<FlowNodeDto> findNodes(@Param("userId") String userId,
                                @Param("year") int year,
                                @Param("month") int month);

    List<FlowLinkDto> findLinks(@Param("userId") String userId,
                                @Param("year") int year,
                                @Param("month") int month);
}