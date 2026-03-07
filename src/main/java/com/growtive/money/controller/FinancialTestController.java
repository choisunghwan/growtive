package com.growtive.money.controller;

import com.growtive.money.service.FinancialSnapshotService;
import jakarta.servlet.http.HttpSession;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.YearMonth;

@RestController
@RequestMapping("/test")
@RequiredArgsConstructor
public class FinancialTestController {

    private final FinancialSnapshotService financialSnapshotService;

    private String getUserId(HttpSession session) {
        String userId = (String) session.getAttribute("userId");
        if (userId == null) {
            throw new RuntimeException("로그인이 필요합니다.");
        }
        return userId;
    }

    @GetMapping("/create-snapshot")
    public String createSnapshot(HttpSession session) {

        String userId = (String) session.getAttribute("userId");
        if (userId == null) {
            throw new RuntimeException("로그인이 필요합니다.");
        }

        YearMonth now = YearMonth.now();

        financialSnapshotService.createMonthlySnapshotIfNotExists(
                userId,
                now.getYear(),
                now.getMonthValue()
        );

        return "snapshot created";
    }
}