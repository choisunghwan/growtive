package com.growtive.user;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class UserService {
    private final UserMapper mapper;
//    private final BCryptPasswordEncoder encoder;

    @Transactional
    public void signup(String email, String displayName, String rawPassword) {
        if (mapper.findByEmail(email) != null) {
            throw new IllegalArgumentException("이미 등록된 이메일 입니다.");
        }
        UserAccount u = UserAccount.builder()
                .email(email)
                .displayName(displayName)
                .passwordHash(rawPassword)
                .build();
        mapper.insert(u);
    }

    public List<UserAccount> list() {
        return mapper.findAll();
    }
}
