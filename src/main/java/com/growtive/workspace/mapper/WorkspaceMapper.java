package com.growtive.workspace.mapper;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

@Mapper
public interface WorkspaceMapper {
    Long findOwnerUserId(@Param("workspaceId") long workspaceId);
}