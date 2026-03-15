package com.growtive.money.service;

public interface FinancialCloseService {

    void closeMonth(Long userId, int year, int month);

    boolean isMonthClosed(Long userId, int year, int month);
}