package com.growtive.money.service;

import com.growtive.money.dto.FlowLinkDto;
import com.growtive.money.dto.FlowNodeDto;
import com.growtive.money.dto.FlowResponseDto;
import com.growtive.money.mapper.FinancialFlowMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class FinancialFlowServiceImpl implements FinancialFlowService {

    private final FinancialFlowMapper mapper;

    @Override
    public FlowResponseDto getMonthlyFlow(Long userId, int year, int month) {

        // 🔥 Mapper 호출 시 userId = String 일치
        List<FlowNodeDto> nodes = mapper.findNodes(userId, year, month);
        List<FlowLinkDto> links = mapper.findLinks(userId, year, month);

        long totalIncome = 0;
        long totalOutflow = 0;

        // INCOME 총합 계산
        for (FlowNodeDto node : nodes) {
            if ("INCOME".equals(node.getType())) {
                totalIncome += node.getMonthlyAmount();
            }
        }

        // 기존 링크 총합 계산
        for (FlowLinkDto link : links) {
            totalOutflow += link.getValue();
        }

        long remaining = totalIncome - totalOutflow;

        if (remaining > 0) {

            // 가용금 노드 추가
            FlowNodeDto remainNode = new FlowNodeDto();
            remainNode.setId(-1L);
            remainNode.setName("가용금");
            remainNode.setType("REMAIN");
            remainNode.setMonthlyAmount(remaining);

            nodes.add(remainNode);

            // 첫 번째 INCOME 노드 찾기
            FlowNodeDto incomeNode = nodes.stream()
                    .filter(n -> "INCOME".equals(n.getType()))
                    .findFirst()
                    .orElseThrow();

            // 가용금 링크 추가
            FlowLinkDto remainLink = new FlowLinkDto();
            remainLink.setSource(incomeNode.getId());
            remainLink.setTarget(-1L);
            remainLink.setValue(remaining);

            links.add(remainLink);
        }

        return new FlowResponseDto(nodes, links);
    }
}