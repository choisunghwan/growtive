package com.growtive.money.controller;

import com.growtive.money.dto.MonthlySnapshotUpdateRequestDto;
import com.growtive.money.dto.SnapshotNodeDto;
import com.growtive.money.service.FinancialSnapshotService;
import jakarta.servlet.http.HttpSession;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/money")
@RequiredArgsConstructor
public class FinancialSnapshotController {

    private final FinancialSnapshotService snapshotService;

    private Long getUserId(HttpSession session) {
        Long userId = (Long) session.getAttribute("userId");
        if (userId == null) throw new RuntimeException("로그인이 필요합니다.");
        return userId;
    }

    // 🔥 snapshot 노드 조회
    @GetMapping("/snapshot")
    public List<SnapshotNodeDto> getSnapshot(
            @RequestParam int year,
            @RequestParam int month,
            HttpSession session) {

        Long  userId = getUserId(session);

        snapshotService.createMonthlySnapshotIfNotExists(userId, year, month);
        return snapshotService.getMonthlySnapshotNodes(userId, year, month);
    }

    @PostMapping("/snapshot/update")
    public String updateMonthlySnapshot(
            @RequestBody MonthlySnapshotUpdateRequestDto request,
            HttpSession session
    ) {
        Long  userId = getUserId(session);
        snapshotService.ensureAndUpdateMonthlySnapshot(userId, request);
        return "ok";
    }
}