package com.growtive.auth.util;

import java.security.SecureRandom;
import java.util.Base64;

public class TokenUtil {
    private static final SecureRandom random = new SecureRandom();

    public static String generateToken(int bytes) {
        byte[] buf = new byte[bytes];
        random.nextBytes(buf);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(buf);
    }
}