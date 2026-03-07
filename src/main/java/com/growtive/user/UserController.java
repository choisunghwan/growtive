package com.growtive.user;

import jakarta.validation.constraints.*;
import lombok.Getter; import lombok.Setter;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/users")
public class UserController {
    private final UserService service;

    @Getter @Setter
    static class SignupReq {
        @Email @NotBlank private String email;
        @NotBlank          private String displayName;
        @NotBlank @Size(min=8) private String password;
    }

    @PostMapping("/signup")
    public ResponseEntity<?> signup(@RequestBody SignupReq req) {
        service.signup(req.getEmail(), req.getDisplayName(), req.getPassword());
        return ResponseEntity.ok().build();
    }

    @GetMapping
    public List<UserAccount> list() {
        return service.list();
    }
}
