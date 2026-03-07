package com.growtive.documind.mapper;

import com.growtive.documind.model.Summary;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

@Mapper
public interface SummaryMapper {
    int insert(Summary s);
    List<Summary> findByDocumentId(@Param("docId") Long docId);

    // 🔥 추가
    int deleteByDocumentId(@Param("documentId") Long documentId);
}
