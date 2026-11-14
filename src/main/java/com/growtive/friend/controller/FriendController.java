package com.growtive.friend.controller;

import com.growtive.common.exception.UnauthorizedException;
import com.growtive.friend.dto.FriendConnectionDto;
import com.growtive.friend.dto.FriendRequestCreateDto;
import com.growtive.friend.service.FriendService;
import jakarta.servlet.http.HttpSession;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/friends")
@RequiredArgsConstructor
public class FriendController {

    private final FriendService service;

    private Long getUserId(HttpSession session) {
        Long userId = (Long) session.getAttribute("userId");
        if (userId == null) throw new UnauthorizedException("로그인이 필요합니다.");
        return userId;
    }

    @PostMapping("/requests")
    public FriendConnectionDto createRequest(@RequestBody FriendRequestCreateDto request, HttpSession session) {
        return service.createRequest(getUserId(session), request.getUsername());
    }

    @GetMapping("/search")
    public List<com.growtive.friend.mapper.UserBasic> search(@RequestParam("q") String query, HttpSession session) {
        return service.searchUsers(getUserId(session), query);
    }

    @GetMapping("/requests/incoming")
    public List<FriendConnectionDto> incoming(HttpSession session) {
        return service.getIncoming(getUserId(session));
    }

    @GetMapping("/requests/outgoing")
    public List<FriendConnectionDto> outgoing(HttpSession session) {
        return service.getOutgoing(getUserId(session));
    }

    @PostMapping("/requests/{id}/accept")
    public void accept(@PathVariable Long id, HttpSession session) {
        service.accept(getUserId(session), id);
    }

    @GetMapping
    public List<FriendConnectionDto> friends(HttpSession session) {
        return service.getFriends(getUserId(session));
    }

    @DeleteMapping("/{id}")
    public void remove(@PathVariable Long id, HttpSession session) {
        service.remove(getUserId(session), id);
    }

}
