package com.growtive.auth.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class RegisterRequestDto {

    private String username;
    private String password;
    private String displayName;
    private String email;

}