package com.growtive.workspace.mapper;

import com.growtive.common.enums.WorkspaceRole;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

@Mapper
public interface WorkspaceMemberMapper {
    String findRoleString(@Param("workspaceId") long workspaceId, @Param("userId") long userId);

    void insertMember(@Param("workspaceId") long workspaceId,
                      @Param("userId") long userId,
                      @Param("role") WorkspaceRole role);
}
