package com.growtive.auth.mapper;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.time.LocalDateTime;

@Mapper
public interface InviteMapper {

    void insertInvite(@Param("workspaceId") long workspaceId,
                      @Param("email") String email,
                      @Param("role") String role,
                      @Param("tokenHash") String tokenHash,
                      @Param("expiresAt") LocalDateTime expiresAt,
                      @Param("createdBy") long createdBy);

    InviteRow findValidByTokenHash(@Param("tokenHash") String tokenHash);

    void markUsed(@Param("id") long inviteId);

    class InviteRow {
        public long id;
        public long workspaceId;
        public String email;
        public String role;
    }
}