package com.growtive.money.controller;

import com.growtive.money.service.FinancialCloseService;
import jakarta.servlet.http.HttpSession;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/money")
@RequiredArgsConstructor
public class FinancialCloseController {

    private final FinancialCloseService service;

    private String getUserId(HttpSession session) {
        String userId = (String) session.getAttribute("userId");
        if (userId == null) {
            throw new RuntimeException("로그인이 필요합니다.");
        }
        return userId;
    }

    @PostMapping("/close-month")
    public String closeMonth(@RequestParam int year,
                             @RequestParam int month,
                             HttpSession session) {

        String userId = getUserId(session);

        service.closeMonth(userId, year, month);

        return "closed";
    }
}