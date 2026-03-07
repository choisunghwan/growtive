package com.growtive.auth.service;

import com.growtive.user.model.User;

public interface AuthService {

    /*회원가입*/
    void register(String username, String password, String displayName, String email);
    /*로그인*/
    User login(String username, String password);
}