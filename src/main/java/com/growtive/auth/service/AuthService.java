package com.growtive.auth.service;

import com.growtive.auth.mapper.InviteMapper;
import com.growtive.auth.util.HashUtil;
import com.growtive.common.enums.WorkspaceRole;
import com.growtive.common.exception.BadRequestException;
import com.growtive.common.exception.ForbiddenException;
import com.growtive.user.UserAccount;
import com.growtive.user.UserMapper;
import com.growtive.workspace.mapper.WorkspaceMemberMapper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AuthService {

    private final InviteMapper inviteMapper;
    private final UserMapper userMapper;
    private final WorkspaceMemberMapper workspaceMemberMapper;

    public AuthService(InviteMapper inviteMapper, UserMapper userMapper, WorkspaceMemberMapper workspaceMemberMapper) {
        this.inviteMapper = inviteMapper;
        this.userMapper = userMapper;
        this.workspaceMemberMapper = workspaceMemberMapper;
    }

    public record VerifyResult(long userId, long workspaceId, WorkspaceRole role) {}

    @Transactional
    public VerifyResult verifyMagicLink(String token) {
        if (token == null || token.isBlank()) throw new BadRequestException("token is required");

        String tokenHash = HashUtil.sha256Hex(token);
        InviteMapper.InviteRow invite = inviteMapper.findValidByTokenHash(tokenHash);
        if (invite == null) throw new ForbiddenException("Invalid or expired invite link");

        String email = invite.email.trim().toLowerCase();

        // ✅ 1) user upsert (findByEmail -> 없으면 insert)
        UserAccount user = userMapper.findByEmail(email);
        if (user == null) {
            UserAccount newUser = new UserAccount();
            newUser.setEmail(email);

            // (선택) displayName 같은 필드가 있으면 여기서 세팅
            // newUser.setName(email.split("@")[0]);

            userMapper.insert(newUser);

            user = userMapper.findByEmail(email);
            if (user == null) throw new RuntimeException("user insert failed");
        }

        long userId = user.getId(); // ✅ UserAccount에 id getter가 있어야 함

        // ✅ 2) workspace membership upsert
        WorkspaceRole role = WorkspaceRole.valueOf(invite.role);

        String existingRole = workspaceMemberMapper.findRoleString(invite.workspaceId, userId);
        if (existingRole == null) {
            workspaceMemberMapper.insertMember(invite.workspaceId, userId, role);
        }

        // ✅ 3) invite 1회용 처리
        inviteMapper.markUsed(invite.id);

        return new VerifyResult(userId, invite.workspaceId, role);
    }
}
