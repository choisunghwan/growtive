package com.growtive.user.model;

import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
public class User {

    private Long id;

    private String username;
    private String password;

    private String displayName;
    private String email;

    private String provider;
    private String providerId;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

}