package com.growtive.auth.service;

import com.growtive.auth.mapper.InviteMapper;
import com.growtive.auth.util.HashUtil;
import com.growtive.auth.util.TokenUtil;
import com.growtive.common.enums.WorkspaceRole;
import com.growtive.common.exception.BadRequestException;
import com.growtive.common.exception.NotFoundException;
import com.growtive.workspace.mapper.WorkspaceMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service
public class InviteService {

    private final InviteMapper inviteMapper;
    private final WorkspaceMapper workspaceMapper;

    @Value("${app.base-url:http://localhost:8080}")
    private String baseUrl;

    public InviteService(InviteMapper inviteMapper, WorkspaceMapper workspaceMapper) {
        this.inviteMapper = inviteMapper;
        this.workspaceMapper = workspaceMapper;
    }

    @Transactional
    public String createInviteLink(long workspaceId, String email, WorkspaceRole role, long createdByUserId) {
        if (email == null || email.isBlank()) throw new BadRequestException("email is required");
        if (role == null) role = WorkspaceRole.MEMBER;

        Long ownerId = workspaceMapper.findOwnerUserId(workspaceId);
        if (ownerId == null) throw new NotFoundException("workspace not found: " + workspaceId);

        String token = TokenUtil.generateToken(32);
        String tokenHash = HashUtil.sha256Hex(token);

        LocalDateTime expiresAt = LocalDateTime.now().plusMinutes(30);

        inviteMapper.insertInvite(
                workspaceId,
                email.trim().toLowerCase(),
                role.name(),
                tokenHash,
                expiresAt,
                createdByUserId
        );

        return baseUrl + "/auth/verify?token=" + token;
    }
}