package com.growtive.auth.service;

public interface AuthService {

    /*회원가입*/
    void register(String username, String password, String displayName, String email);
    /*로그인*/
    Long login(String username, String password);
}