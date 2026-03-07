package com.growtive.user;

import org.apache.ibatis.annotations.Mapper;
import java.util.List;

@Mapper
public interface UserMapper {
    void insert(UserAccount user);
    List<UserAccount> findAll();
    UserAccount findByEmail(String email);
}
