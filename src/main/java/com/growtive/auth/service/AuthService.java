package com.growtive.auth.service;

import com.growtive.user.model.User;

import java.time.LocalTime;

public interface AuthService {

    /*회원가입*/
    void register(String username, String password, String displayName, String nickname, String email);
    /*로그인*/
    User login(String username, String password);
    /*소셜 로그인 - 최초 로그인이면 회원가입까지 자동 처리*/
    User loginOrCreateOAuthUser(String provider, String providerId, String nickname);
    /*이미 로그인한 계정에 소셜 계정 연결*/
    void linkOAuthAccount(Long userId, String provider, String providerId);

    /*실시간 급여 카운터용 근무 스케줄 조회*/
    User getUserById(Long userId);
    /*실시간 급여 카운터용 근무 스케줄 저장*/
    void updateWorkSchedule(Long userId, com.growtive.auth.dto.WorkScheduleDto schedule);

    /*닉네임 규칙 검사 + 다듬기 (2~12자 등). 어기면 BadRequestException*/
    String normalizeNickname(String nickname);
    /*닉네임 사용 가능 여부 (exceptUserId 본인은 제외하고 중복 확인)*/
    boolean isNicknameAvailable(String nickname, Long exceptUserId);
    /*닉네임 변경 → 저장된 닉네임 반환*/
    String updateNickname(Long userId, String nickname);
}