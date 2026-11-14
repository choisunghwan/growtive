package com.growtive.sms;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;

/**
 * 📤 안드로이드 '공유하기'로 GrowTive에 문자 보내기 (홈 화면에 설치한 앱, manifest.json의 share_target)
 * - 문자 앱에서 [공유] → GrowTive → /share?text=... 로 들어옴
 * - 화면(SPA)의 #/sms-share 로 넘겨서, 로그인한 사용자의 확인 대기함에 넣고 보여줌
 */
@Controller
public class ShareTargetController {

    @GetMapping("/share")
    public String share(@RequestParam(required = false) String title,
                        @RequestParam(required = false) String text,
                        @RequestParam(required = false) String url) {
        StringBuilder sb = new StringBuilder();
        for (String s : new String[]{title, text, url}) {
            if (s != null && !s.isBlank()) sb.append(sb.length() > 0 ? "\n" : "").append(s);
        }
        String body = sb.length() > 4000 ? sb.substring(0, 4000) : sb.toString();
        return "redirect:/#/sms-share?text=" + URLEncoder.encode(body, StandardCharsets.UTF_8);
    }
}
