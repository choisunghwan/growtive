package com.growtive.friend.service;

import com.growtive.common.exception.BadRequestException;
import com.growtive.common.exception.ForbiddenException;
import com.growtive.common.exception.NotFoundException;
import com.growtive.friend.dto.FriendConnectionDto;
import com.growtive.friend.mapper.FriendConnectionRow;
import com.growtive.friend.mapper.FriendMapper;
import com.growtive.friend.mapper.UserBasic;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class FriendServiceImpl implements FriendService {

    private final FriendMapper mapper;

    @Override
    public List<UserBasic> searchUsers(Long userId, String query) {
        if (query == null || query.isBlank()) {
            return List.of();
        }
        return mapper.searchUsers(query.trim(), userId);
    }

    @Override
    @Transactional
    public FriendConnectionDto createRequest(Long userId, String targetUsername) {
        UserBasic target = mapper.findUserBasicByUsername(targetUsername);
        if (target == null) {
            throw new NotFoundException("사용자를 찾을 수 없습니다: " + targetUsername);
        }
        if (target.getId().equals(userId)) {
            throw new BadRequestException("자기 자신에게는 친구 요청을 보낼 수 없습니다.");
        }
        if (mapper.countExistingBetween(userId, target.getId()) > 0) {
            throw new BadRequestException("이미 요청했거나 이미 친구인 사용자입니다.");
        }

        FriendConnectionRow row = new FriendConnectionRow();
        row.setRequesterId(userId);
        row.setAddresseeId(target.getId());
        mapper.insertRequest(row);

        FriendConnectionDto dto = new FriendConnectionDto();
        dto.setId(row.getId());
        dto.setOtherUserId(target.getId());
        dto.setOtherUsername(target.getUsername());
        dto.setOtherDisplayName(target.getDisplayName());
        dto.setStatus("PENDING");
        dto.setCreatedAt(LocalDateTime.now());
        return dto;
    }

    @Override
    @Transactional(readOnly = true)
    public List<FriendConnectionDto> getIncoming(Long userId) {
        return mapper.findIncoming(userId);
    }

    @Override
    @Transactional(readOnly = true)
    public List<FriendConnectionDto> getOutgoing(Long userId) {
        return mapper.findOutgoing(userId);
    }

    @Override
    @Transactional(readOnly = true)
    public List<FriendConnectionDto> getFriends(Long userId) {
        return mapper.findAccepted(userId);
    }

    @Override
    @Transactional
    public void accept(Long userId, Long connectionId) {
        FriendConnectionRow row = mapper.findById(connectionId);
        if (row == null) {
            throw new NotFoundException("요청을 찾을 수 없습니다: id=" + connectionId);
        }
        if (!row.getAddresseeId().equals(userId)) {
            throw new ForbiddenException("본인에게 온 요청만 수락할 수 있습니다.");
        }
        if (!"PENDING".equals(row.getStatus())) {
            throw new BadRequestException("이미 처리된 요청입니다.");
        }
        mapper.updateStatus(connectionId, "ACCEPTED");
    }

    @Override
    @Transactional
    public void remove(Long userId, Long connectionId) {
        FriendConnectionRow row = mapper.findById(connectionId);
        if (row == null) {
            throw new NotFoundException("연결을 찾을 수 없습니다: id=" + connectionId);
        }
        if (!row.getRequesterId().equals(userId) && !row.getAddresseeId().equals(userId)) {
            throw new ForbiddenException("본인과 관련된 연결만 해제할 수 있습니다.");
        }
        mapper.deleteById(connectionId);
    }

}
