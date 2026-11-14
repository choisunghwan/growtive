package com.growtive.auth.mapper;

import com.growtive.user.model.User;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.time.LocalTime;

@Mapper
public interface AuthMapper {

    /*로그인*/
    User findByUsername(String username);

    /*id로 조회 (근무 스케줄 등 세션에 없는 최신 정보 조회용)*/
    User findById(@Param("id") Long id);

    /*실시간 급여 카운터용 근무 스케줄 저장*/
    void updateWorkSchedule(@Param("userId") Long userId,
                             @Param("workStartTime") LocalTime workStartTime,
                             @Param("workEndTime") LocalTime workEndTime,
                             @Param("workDays") String workDays,
                             @Param("payRule") String payRule,
                             @Param("payDay") Integer payDay,
                             @Param("payWeek") Integer payWeek,
                             @Param("payWeekday") Integer payWeekday,
                             @Param("payAdjust") String payAdjust,
                             @Param("salaryMode") String salaryMode,
                             @Param("salaryAmount") Long salaryAmount);

    /*소셜 로그인 - provider + providerId로 기존 회원 조회*/
    User findByProviderAndProviderId(@Param("provider") String provider, @Param("providerId") String providerId);

    /*이미 로그인한 회원에게 소셜 계정 연결*/
    void linkProvider(@Param("userId") Long userId, @Param("provider") String provider, @Param("providerId") String providerId);

    /*회원가입*/
    void insertUser(User user);

    /*로그인 성공 시 최근 접속 시각 갱신*/
    void updateLastLogin(@Param("userId") Long userId);


    int countNicknameTaken(@org.apache.ibatis.annotations.Param("nickname") String nickname,
                           @org.apache.ibatis.annotations.Param("exceptUserId") Long exceptUserId);

    int updateNickname(@org.apache.ibatis.annotations.Param("userId") Long userId,
                       @org.apache.ibatis.annotations.Param("nickname") String nickname);
}
