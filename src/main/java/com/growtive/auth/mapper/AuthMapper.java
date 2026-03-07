package com.growtive.auth.mapper;

import com.growtive.user.model.User;
import org.apache.ibatis.annotations.Mapper;

@Mapper
public interface AuthMapper {

    /*로그인*/
    User findByUsername(String username);

    /*회원가입*/
    void insertUser(User user);

}