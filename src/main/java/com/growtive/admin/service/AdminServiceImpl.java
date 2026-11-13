package com.growtive.admin.service;

import com.growtive.admin.dto.AdminUserDto;
import com.growtive.admin.mapper.AdminMapper;
import com.growtive.common.exception.BadRequestException;
import com.growtive.common.exception.NotFoundException;
import com.growtive.setting.mapper.UserSettingMapper;
import com.growtive.shared.service.SharedCalendarService;
import lombok.RequiredArgsConstructor;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class AdminServiceImpl implements AdminService {

    private final AdminMapper mapper;
    private final UserSettingMapper userSettingMapper;
    private final SharedCalendarService sharedCalendarService;

    @Override
    @Transactional(readOnly = true)
    public List<AdminUserDto> getAllUsers() {
        return mapper.findAllUsers();
    }

    @Override
    @Transactional
    public AdminUserDto updateUser(Long id, String displayName, String email) {
        if (mapper.findUserById(id) == null) {
            throw new NotFoundException("사용자를 찾을 수 없습니다: id=" + id);
        }
        if (displayName == null || displayName.isBlank()) {
            throw new BadRequestException("이름을 입력해주세요.");
        }
        if (email == null || email.isBlank()) {
            throw new BadRequestException("이메일을 입력해주세요.");
        }
        if (mapper.countByEmailExcludingId(email, id) > 0) {
            throw new BadRequestException("이미 사용 중인 이메일입니다.");
        }
        mapper.updateUserProfile(id, displayName, email);
        return mapper.findUserById(id);
    }

    @Override
    @Transactional
    public void deleteUser(Long id, Long requestingAdminId) {
        if (mapper.findUserById(id) == null) {
            throw new NotFoundException("사용자를 찾을 수 없습니다: id=" + id);
        }
        if (id.equals(requestingAdminId)) {
            throw new BadRequestException("자기 자신은 탈퇴 처리할 수 없습니다.");
        }
        try {
            userSettingMapper.deleteAllByUser(id); // 사용자 설정(내역 핀 등)은 함께 삭제
            sharedCalendarService.removeUserEverywhere(id); // 공유 캘린더에서 빼고, 참여자 0명이 된 캘린더는 삭제
            mapper.deleteUser(id);
        } catch (DataIntegrityViolationException e) {
            throw new BadRequestException("이 사용자는 연결된 데이터(워크스페이스/초대 등)가 있어 삭제할 수 없습니다.");
        }
    }
}
