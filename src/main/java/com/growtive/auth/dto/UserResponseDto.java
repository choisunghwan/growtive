package com.growtive.auth.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;

/**
 * 로그인 사용자 정보 응답 DTO
 *
 * 사용 API
 * - GET /api/auth/me
 *
 * 역할
 * - 현재 로그인 사용자 정보 반환
 * - 프론트 authStore 동기화용
 */
@Getter
@NoArgsConstructor
@AllArgsConstructor
public class UserResponseDto {

    private Long userId;

    private String username;

    private String displayName;

}