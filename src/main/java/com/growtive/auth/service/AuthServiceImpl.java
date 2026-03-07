package com.growtive.auth.service;

import com.growtive.auth.mapper.AuthMapper;
import com.growtive.user.model.User;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AuthServiceImpl implements AuthService {

    private final AuthMapper authMapper;

    @Override
    public void register(String username,
                         String password,
                         String displayName,
                         String email) {

        User existUser = authMapper.findByUsername(username);

        if (existUser != null) {
            throw new RuntimeException("이미 존재하는 아이디입니다.");
        }

        User user = new User();

        user.setUsername(username);
        user.setPassword(password);
        user.setDisplayName(displayName);
        user.setEmail(email);

        authMapper.insertUser(user);
    }

    @Override
    public User login(String username, String password) {

        User user = authMapper.findByUsername(username);

        if (user == null) {
            throw new RuntimeException("사용자가 없습니다.");
        }

        if (!user.getPassword().equals(password)) {
            throw new RuntimeException("비밀번호가 틀립니다.");
        }

        return user;
    }
}