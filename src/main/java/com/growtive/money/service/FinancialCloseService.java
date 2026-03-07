package com.growtive.money.service;

public interface FinancialCloseService {

    void closeMonth(Long userId, int year, int month);
}