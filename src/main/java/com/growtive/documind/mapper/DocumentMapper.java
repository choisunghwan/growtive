package com.growtive.documind.mapper;
import com.growtive.documind.model.Document;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import java.util.List;

@Mapper
public interface DocumentMapper {
    int insert(Document doc);                 // useGeneratedKeys
    Document findById(@Param("id") Long id);
    List<Document> findAll();

    // 🔥 추가
    int delete(@Param("id") Long id);
}
