package com.growtive.stock;

import com.growtive.stock.model.Stock;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

/**
 * MyBatis Mapper 인터페이스
 * - XML(StockMapper.xml)의 각 <select/insert/update/delete>와 1:1 대응
 * - 메서드명 = XML의 id
 * - 작성자: 최성환
 */
@Mapper
public interface StockMapper {
    /**
     * 전체 목록 + 검색(q)
     * @param q 심볼/이름 LIKE 검색어 (null/빈문자면 전체)
     */
    List<Stock> findAll(@Param("q") String q);
    /** 단건 조회 */
    Stock findById(@Param("id") Long id);
    /** 신규 등록 (생성된 PK는 Stock.id에 채워짐) */
    int insert(Stock stock);
    /** 종목명 수정 (id 기준으로 name만 업데이트) */
    int update(Stock stock);
    /** 삭제 */
    int delete(@Param("id") Long id);
}