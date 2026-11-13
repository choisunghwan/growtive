package com.growtive.setting.mapper;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

/**
 * 사용자별 설정 (user_setting: user_id + setting_key → setting_value)
 * 테이블은 UserSettingTableInitializer가 서버 시작 시 없으면 만든다.
 */
@Mapper
public interface UserSettingMapper {

    String findValue(@Param("userId") Long userId, @Param("key") String key);

    /** 있으면 값 갱신, 없으면 추가 */
    int upsert(@Param("userId") Long userId, @Param("key") String key, @Param("value") String value);

    int delete(@Param("userId") Long userId, @Param("key") String key);

    /** 회원 삭제 시 그 회원의 설정 전부 삭제 */
    int deleteAllByUser(@Param("userId") Long userId);
}
