package com.invinciblegame.dto.response;

public record CardResponse(
    Long id,
    String name,
    String rarity,
    String faction,
    Integer maxHp,
    Integer attack,
    Integer defense,
    Integer speed,
    boolean owned
) {}
