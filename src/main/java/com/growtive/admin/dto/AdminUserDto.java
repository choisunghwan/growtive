package com.growtive.admin.dto;

import lombok.Data;

import java.time.LocalDateTime;

@Data
public class AdminUserDto {

    private Long id;
    private String username;
    private String displayName;
    private String nickname;
    private String email;
    private String role;
    private LocalDateTime lastLoginAt;
    private LocalDateTime createdAt;
}
