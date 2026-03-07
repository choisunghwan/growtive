package com.growtive.stock;

import com.growtive.stock.dto.*;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import java.util.List;


// StockController.java
@RestController
@RequestMapping("/api/stocks")
@RequiredArgsConstructor
public class StockController {
    private final StockService svc;

    @GetMapping                   // 목록
    public List<StockDto> list(@RequestParam(required=false) String q) { return svc.list(q); }

    @PostMapping                  // 종목 생성(내 DB 등록)
    public Long create(@RequestBody StockCreateReq req) { return svc.create(req); }

    @GetMapping("/{id}")          // 상세 + 내 노트
    public StockDetailRes detail(@PathVariable Long id) { return svc.detail(id); }

    @PutMapping("/{id}")          // 종목 기본 수정(이름 등)
    public void update(@PathVariable Long id, @RequestBody StockUpdateReq req) { svc.update(id, req); }

    @DeleteMapping("/{id}")       // 삭제(노트까지 CASCADE)
    public void delete(@PathVariable Long id) { svc.delete(id); }

    // 내 노트 CRUD
    @PostMapping("/{id}/note")
    public Long upsertNote(@PathVariable Long id, @RequestBody NoteUpsertReq req) { return svc.upsertNote(id, req); }
    @DeleteMapping("/{id}/note/{noteId}")
    public void deleteNote(@PathVariable Long id, @PathVariable Long noteId) { svc.deleteNote(id, noteId); }
}
