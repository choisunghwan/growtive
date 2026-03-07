package com.growtive.user;

import lombok.*;
import java.time.LocalDateTime;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class UserAccount {
    private Long id;
    private String email;
    private String displayName;
    private String passwordHash;
    private LocalDateTime createdAt;
}
