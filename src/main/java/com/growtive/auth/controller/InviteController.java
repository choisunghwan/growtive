package com.growtive.auth.controller;


import com.growtive.auth.service.InviteService;
import com.growtive.common.enums.WorkspaceRole;
import org.springframework.web.bind.annotation.*;

@RestController
public class InviteController {

    private final InviteService inviteService;

    public InviteController(InviteService inviteService) {
        this.inviteService = inviteService;
    }

    public record InviteCreateReq(String email, String role, Long createdByUserId) {}

    @PostMapping("/workspaces/{workspaceId}/invites")
    public String createInvite(@PathVariable long workspaceId, @RequestBody InviteCreateReq req) {
        WorkspaceRole role = (req.role == null || req.role.isBlank())
                ? WorkspaceRole.MEMBER
                : WorkspaceRole.valueOf(req.role);

        long createdBy = (req.createdByUserId == null) ? 1L : req.createdByUserId; // MVP용
        String link = inviteService.createInviteLink(workspaceId, req.email, role, createdBy);

        System.out.println("[INVITE LINK] " + link);
        return link;
    }
}