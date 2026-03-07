package com.growtive.documind.mapper;

import com.growtive.documind.model.QaLog;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

@Mapper
public interface QaMapper {
    int insert(QaLog qa);
    List<QaLog> findByDocumentId(@Param("docId") Long docId);

    // 🔥 추가
    int deleteByDocumentId(@Param("documentId") Long documentId);
}
