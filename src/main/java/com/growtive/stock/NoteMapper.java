package com.growtive.stock;


import com.growtive.stock.model.StockNote;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

@Mapper
public interface NoteMapper {
    StockNote findLatestByStockId(@Param("stockId") Long stockId);
    int insert(StockNote note);
    int update(StockNote note);
    int delete(@Param("id") Long id);
}