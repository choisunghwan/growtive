package com.growtive.auth.service;

import com.growtive.auth.mapper.AuthMapper;
import com.growtive.common.exception.BadRequestException;
import com.growtive.common.exception.UnauthorizedException;
import com.growtive.user.model.User;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.LocalTime;

@Service
@RequiredArgsConstructor
public class AuthServiceImpl implements AuthService {

    private final AuthMapper authMapper;
    private final BCryptPasswordEncoder passwordEncoder;

    /**
     * 회원가입
     */
    @Override
    public void register(String username,
                         String password,
                         String displayName,
                         String nickname,
                         String email) {

        User existUser = authMapper.findByUsername(username);

        if (existUser != null) {
            throw new BadRequestException("이미 존재하는 아이디입니다.");
        }

        // 새로 가입하는 사람은 닉네임 필수 (다른 사람에게는 실명 대신 닉네임이 보임)
        String cleanNickname = normalizeNickname(nickname);
        if (!isNicknameAvailable(cleanNickname, -1L)) {
            throw new BadRequestException("이미 사용 중인 닉네임입니다.");
        }

        // 🔐 BCrypt 암호화
        String encodedPassword = passwordEncoder.encode(password);

        User user = new User();

        user.setUsername(username);
        user.setPassword(encodedPassword);   // 🔐 암호화된 비밀번호 저장
        user.setDisplayName(displayName);
        user.setNickname(cleanNickname);
        user.setEmail(email);

        try {
            authMapper.insertUser(user);
        } catch (org.springframework.dao.DuplicateKeyException e) {
            throw new BadRequestException("이미 사용 중인 닉네임입니다.");
        }
    }

    /* ======================= 닉네임 ======================= */

    private static final int NICKNAME_MIN = 2;
    private static final int NICKNAME_MAX = 12;

    @Override
    public String normalizeNickname(String nickname) {
        String n = nickname == null ? "" : nickname.strip().replaceAll("\\s+", " ");
        int len = n.codePointCount(0, n.length());
        if (len < NICKNAME_MIN || len > NICKNAME_MAX) {
            throw new BadRequestException("닉네임은 " + NICKNAME_MIN + "~" + NICKNAME_MAX + "자로 입력해주세요.");
        }
        if (n.chars().anyMatch(c -> Character.isISOControl(c) || "<>\"'&\\`".indexOf(c) >= 0)) {
            throw new BadRequestException("닉네임에는 < > \" ' & \\ ` 문자를 쓸 수 없습니다.");
        }
        return n;
    }

    @Override
    public boolean isNicknameAvailable(String nickname, Long exceptUserId) {
        return authMapper.countNicknameTaken(nickname, exceptUserId == null ? -1L : exceptUserId) == 0;
    }

    @Override
    public String updateNickname(Long userId, String nickname) {
        String clean = normalizeNickname(nickname);
        if (!isNicknameAvailable(clean, userId)) {
            throw new BadRequestException("이미 사용 중인 닉네임입니다.");
        }
        try {
            authMapper.updateNickname(userId, clean);
        } catch (org.springframework.dao.DuplicateKeyException e) {
            throw new BadRequestException("이미 사용 중인 닉네임입니다.");
        }
        return clean;
    }

    /**
     * 로그인
     */
    @Override
    public User login(String username, String password) {

        User user = authMapper.findByUsername(username);

        if (user == null) {
            throw new UnauthorizedException("사용자가 없습니다.");
        }

        // 🔐 BCrypt 비교
        if (!passwordEncoder.matches(password, user.getPassword())) {
            throw new UnauthorizedException("비밀번호가 틀립니다.");
        }

        authMapper.updateLastLogin(user.getId());

        return user;
    }

    /**
     * 소셜 로그인 (카카오 등)
     * - provider + providerId로 기존 회원이면 그대로 로그인
     * - 없으면 닉네임만으로 회원가입 처리 (username/email/password는 자동 생성되는 형식적인 값)
     */
    @Override
    public User loginOrCreateOAuthUser(String provider, String providerId, String nickname) {

        User user = authMapper.findByProviderAndProviderId(provider, providerId);

        if (user == null) {
            User newUser = new User();
            newUser.setProvider(provider);
            newUser.setProviderId(providerId);
            newUser.setDisplayName(nickname != null && !nickname.isBlank() ? nickname : provider + " 사용자");
            newUser.setUsername(provider.toLowerCase() + "_" + providerId);
            newUser.setEmail(provider.toLowerCase() + "_" + providerId + "@growtive.local");
            // 🔐 소셜 로그인 계정은 아이디/비밀번호로 로그인할 수 없도록 임의의 값으로 암호화
            newUser.setPassword(passwordEncoder.encode(java.util.UUID.randomUUID().toString()));

            authMapper.insertUser(newUser);

            user = authMapper.findByProviderAndProviderId(provider, providerId);
        }

        authMapper.updateLastLogin(user.getId());

        return user;
    }

    /**
     * 이미 로그인한 계정에 소셜 계정 연결
     * - 해당 provider/providerId가 이미 다른 계정에 연결되어 있으면 거부
     */
    @Override
    public void linkOAuthAccount(Long userId, String provider, String providerId) {

        User existing = authMapper.findByProviderAndProviderId(provider, providerId);

        if (existing != null && !existing.getId().equals(userId)) {
            throw new BadRequestException("이미 다른 계정에 연결된 카카오 계정입니다.");
        }

        authMapper.linkProvider(userId, provider, providerId);
    }

    @Override
    public User getUserById(Long userId) {
        return authMapper.findById(userId);
    }

    @Override
    public void updateWorkSchedule(Long userId, LocalTime workStartTime, LocalTime workEndTime, String workDays) {
        authMapper.updateWorkSchedule(userId, workStartTime, workEndTime, workDays);
    }
}