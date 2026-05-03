package com.invinciblegame.dto.response;

public record BattleAllyResponse(
    Long characterId,
    String name,
    int currentHp,
    int maxHp,
    int attack,
    int defense,
    int speed,
    int skillCooldownRemaining,
    String imageUrl,
    boolean desperationUsed
) {}
