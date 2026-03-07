package com.growtive.stock.model;


import jakarta.validation.constraints.NotBlank;
import lombok.*;

/**
 * Stock 도메인 모델
 * - stock_master 테이블의 한 행을 표현
 * - MyBatis ResultMap(StockMap)과 1:1 매핑
 * - 작성자: 최성환
 */
@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class Stock {
    private Long id;                 // PK (AUTO_INCREMENT)
    @NotBlank(message = "심볼은 필수입니다.")
    private String symbol;           // 예: AAPL, TSLA, 005930
    @NotBlank(message = "시장 코드는 필수입니다.")
    private String market;           // 예: US, KR
    @NotBlank(message = "이름은 필수입니다.")
    private String name;             // 예: 애플, 삼성전자
}