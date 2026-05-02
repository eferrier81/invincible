package com.invinciblegame.dto.response;

import java.time.LocalDateTime;
import java.util.List;

public record BattleResponse(
    Long id,
    Long bossId,
    Long deckId,
    String result,
    boolean hardcore,
    Integer turnsTaken,
    Integer bossCurrentHp,
    Integer teamCurrentHp,
    boolean rewardClaimed,
    LocalDateTime createdAt,
    LocalDateTime endedAt,
    List<String> log
) {}
