package com.growtive.auth.security;

import com.growtive.auth.service.AuthService;
import com.growtive.common.exception.BadRequestException;
import com.growtive.user.model.User;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.client.authentication.OAuth2AuthenticationToken;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.web.authentication.AuthenticationSuccessHandler;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.util.Map;

/**
 * 카카오 등 소셜 로그인 성공 후 처리.
 * - provider/providerId 기준으로 회원 조회/생성
 * - 기존 세션 기반 인증(AuthController)과 동일한 세션 속성을 채워서
 *   /api/auth/me 등 나머지 API가 그대로 동작하도록 함
 */
@Component
@RequiredArgsConstructor
public class OAuth2LoginSuccessHandler implements AuthenticationSuccessHandler {

    private static final Logger log = LoggerFactory.getLogger(OAuth2LoginSuccessHandler.class);

    private final AuthService authService;

    @Override
    public void onAuthenticationSuccess(HttpServletRequest request,
                                         HttpServletResponse response,
                                         Authentication authentication) throws IOException, ServletException {
        try {
            handle(request, response, authentication);
        } catch (RuntimeException e) {
            // 소셜 로그인 콜백 처리 중 예외가 나면 하얀 화면(Whitelabel) 대신
            // 로그인 화면으로 돌려보내고, 원인은 로그로 남긴다.
            log.error("소셜 로그인 처리 실패", e);
            response.sendRedirect("/#/login?oauthError=1");
        }
    }

    private void handle(HttpServletRequest request,
                         HttpServletResponse response,
                         Authentication authentication) throws IOException {

        OAuth2AuthenticationToken oauthToken = (OAuth2AuthenticationToken) authentication;
        OAuth2User oAuth2User = oauthToken.getPrincipal();
        String registrationId = oauthToken.getAuthorizedClientRegistrationId(); // 예: "kakao"

        Map<String, Object> attributes = oAuth2User.getAttributes();
        String providerId = String.valueOf(attributes.get("id"));
        String nickname = extractNickname(attributes);
        String provider = registrationId.toUpperCase();

        HttpSession session = request.getSession();

        // 이미 로그인한 상태에서 "계정 연결"로 들어온 경우 -> 기존 계정에 연결만 하고 세션은 그대로 둠
        Long linkUserId = (Long) session.getAttribute("oauth2LinkUserId");
        if (linkUserId != null) {
            session.removeAttribute("oauth2LinkUserId");
            try {
                authService.linkOAuthAccount(linkUserId, provider, providerId);
                session.setAttribute("provider", provider);
                response.sendRedirect("/#/mypage?linked=1");
            } catch (BadRequestException e) {
                response.sendRedirect("/#/mypage?linkError=" + java.net.URLEncoder.encode(e.getMessage(), "UTF-8"));
            }
            return;
        }

        User user = authService.loginOrCreateOAuthUser(provider, providerId, nickname);

        session.setAttribute("userId", user.getId());
        session.setAttribute("username", user.getUsername());
        session.setAttribute("displayName", user.getDisplayName());
        session.setAttribute("nickname", user.getNickname());
        session.setAttribute("role", user.getRole());
        session.setAttribute("provider", user.getProvider());

        response.sendRedirect("/#/calendar");
    }

    @SuppressWarnings("unchecked")
    private String extractNickname(Map<String, Object> attributes) {
        Object kakaoAccountObj = attributes.get("kakao_account");
        if (kakaoAccountObj instanceof Map) {
            Object profileObj = ((Map<String, Object>) kakaoAccountObj).get("profile");
            if (profileObj instanceof Map) {
                Object nickname = ((Map<String, Object>) profileObj).get("nickname");
                if (nickname != null) return nickname.toString();
            }
        }

        Object propertiesObj = attributes.get("properties");
        if (propertiesObj instanceof Map) {
            Object nickname = ((Map<String, Object>) propertiesObj).get("nickname");
            if (nickname != null) return nickname.toString();
        }

        return null;
    }
}
