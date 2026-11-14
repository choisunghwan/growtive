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
    public void updateWorkSchedule(Long userId, com.growtive.auth.dto.WorkScheduleDto s) {
        // 월급날 규칙 확인 (맞지 않는 값은 저장하지 않음)
        String rule = s.getPayRule() == null || s.getPayRule().isBlank() ? null : s.getPayRule();
        if (rule != null && !java.util.Set.of("DAY", "LAST_DAY", "NTH_WEEKDAY").contains(rule)) {
            throw new BadRequestException("월급날 방식을 다시 선택해주세요.");
        }
        Integer payDay = null, payWeek = null, payWeekday = null;
        if ("DAY".equals(rule)) {
            payDay = s.getPayDay();
            if (payDay == null || payDay < 1 || payDay > 31) throw new BadRequestException("월급 날짜(1~31일)를 선택해주세요.");
        } else if ("NTH_WEEKDAY".equals(rule)) {
            payWeek = s.getPayWeek();
            payWeekday = s.getPayWeekday();
            if (payWeek == null || !(payWeek == -1 || (payWeek >= 1 && payWeek <= 4))) throw new BadRequestException("몇째 주인지 선택해주세요.");
            if (payWeekday == null || payWeekday < 0 || payWeekday > 6) throw new BadRequestException("요일을 선택해주세요.");
        }
        String adjust = rule == null ? null
                : (java.util.Set.of("BEFORE", "AFTER", "KEEP").contains(String.valueOf(s.getPayAdjust())) ? s.getPayAdjust() : "BEFORE");

        String incomeType = java.util.Set.of("SALARY", "ALLOWANCE", "BUDGET").contains(String.valueOf(s.getIncomeType()))
                ? s.getIncomeType() : "SALARY";
        String incomeCategory = null;
        if ("ALLOWANCE".equals(incomeType)) {
            incomeCategory = s.getIncomeCategory() == null || s.getIncomeCategory().isBlank() ? "용돈" : s.getIncomeCategory().trim();
            if (incomeCategory.length() > 20) throw new BadRequestException("수입 카테고리 이름이 너무 깁니다.");
        }
        // 예산 방식은 금액을 직접 입력 (가계부 내역에서 가져올 수입이 없음)
        String mode = "BUDGET".equals(incomeType) || "FIXED".equals(s.getSalaryMode()) ? "FIXED" : "LEDGER";
        Long amount = null;
        if ("FIXED".equals(mode)) {
            amount = s.getSalaryAmount();
            if (amount == null || amount <= 0 || amount > 10_000_000_000L) {
                throw new BadRequestException("BUDGET".equals(incomeType) ? "한 달 예산을 입력해주세요." : "금액을 입력해주세요.");
            }
        }
        authMapper.updateWorkSchedule(userId, s.getWorkStartTime(), s.getWorkEndTime(), s.getWorkDays(),
                rule, payDay, payWeek, payWeekday, adjust, mode, amount, incomeType, incomeCategory);
    }
}