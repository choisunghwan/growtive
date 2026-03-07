package com.growtive.stock;

import com.growtive.stock.dto.*;
import com.growtive.stock.model.Stock;
import com.growtive.stock.model.StockNote;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

/**
 * 애플리케이션 비즈니스 로직
 * - Controller ↔ Mapper 사이의 중간 계층
 * - 트랜잭션 경계/검증/추가 규칙 적용
 * - 작성자: 최성환
 */

@Service
@RequiredArgsConstructor
public class StockService {

    private final StockMapper stockMapper;
    private final NoteMapper noteMapper;

    public List<StockDto> list(String q) {
        return stockMapper.findAll(q).stream()
                .map(s -> StockDto.builder()
                        .id(s.getId())
                        .symbol(s.getSymbol())
                        .market(s.getMarket())
                        .name(s.getName())
                        .build())
                .collect(Collectors.toList());
    }

    public Long create(StockCreateReq req) {
        Stock s = Stock.builder()
                .symbol(req.getSymbol())
                .market(req.getMarket())
                .name(req.getName())
                .build();
        stockMapper.insert(s);
        return s.getId();
    }

    public StockDetailRes detail(Long id) {
        Stock s = stockMapper.findById(id);
        if (s == null) throw new IllegalArgumentException("종목을 찾을 수 없습니다: id=" + id);

        StockNote n = noteMapper.findLatestByStockId(id);
        return StockDetailRes.builder()
                .id(s.getId())
                .symbol(s.getSymbol())
                .market(s.getMarket())
                .name(s.getName())
                .noteId(n != null ? n.getId() : null)
                .buyPrice(n != null ? n.getBuyPrice() : null)
                .sellPrice(n != null ? n.getSellPrice() : null)
                .targetPrice(n != null ? n.getTargetPrice() : null)
                .memo(n != null ? n.getMemo() : null)
                .createdAt(n != null ? n.getCreatedAt() : null)
                .updatedAt(n != null ? n.getUpdatedAt() : null)
                .build();
    }

    public void update(Long id, StockUpdateReq req) {
        Stock s = stockMapper.findById(id);
        if (s == null) throw new IllegalArgumentException("종목을 찾을 수 없습니다: id=" + id);
        s.setName(req.getName());
        stockMapper.update(s);
    }

    public void delete(Long id) {
        stockMapper.delete(id); // note는 FK ON DELETE CASCADE로 같이 삭제
    }

    /** note가 없으면 insert, 있으면 최신 1건을 update */
    public Long upsertNote(Long stockId, NoteUpsertReq req) {
        Stock s = stockMapper.findById(stockId);
        if (s == null) throw new IllegalArgumentException("종목을 찾을 수 없습니다: id=" + stockId);

        StockNote latest = noteMapper.findLatestByStockId(stockId);
        if (latest == null) {
            StockNote n = StockNote.builder()
                    .stockId(stockId)
                    .buyPrice(req.getBuyPrice())
                    .sellPrice(req.getSellPrice())
                    .targetPrice(req.getTargetPrice())
                    .memo(req.getMemo())
                    .build();
            noteMapper.insert(n);
            return n.getId();
        } else {
            latest.setBuyPrice(req.getBuyPrice());
            latest.setSellPrice(req.getSellPrice());
            latest.setTargetPrice(req.getTargetPrice());
            latest.setMemo(req.getMemo());
            noteMapper.update(latest);
            return latest.getId();
        }
    }

    public void deleteNote(Long stockId, Long noteId) {
        // 필요시 stockId 검증 추가 가능
        noteMapper.delete(noteId);
    }
}
