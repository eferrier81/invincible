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
    boolean owned,
    Integer duplicateCount,
    Integer abilityUpgradeIndex,
    Integer level,
    String passiveKey,
    String passiveValue,
    /** Web path served under `/images/...` (e.g. `/images/characters/invincible.png`). */
    String imageUrl
) {}
