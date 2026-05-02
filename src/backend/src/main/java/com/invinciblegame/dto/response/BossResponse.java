package com.invinciblegame.dto.response;

public record BossResponse(
    Long id,
    String name,
    String difficulty,
    Integer maxHp,
    Integer attack,
    Integer defense,
    Integer speed,
    Double hardcoreMultiplier,
    String description
) {}
