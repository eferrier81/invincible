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
    Integer bossMaxHp,
    String bossImageUrl,
    Integer teamCurrentHp,
    /** Character id that must act next (3v1 turn order). Null when battle finished. */
    Long expectedCharacterId,
    int roundNumber,
    List<BattleAllyResponse> allies,
    /** Turns of own actions before Skill is available again after a Skill (ATTACK has no cooldown). */
    int skillCooldownAfterUse,
    /** 1 = upper third HP, 2 = middle, 3 = lower (boss phases). */
    int bossPhase,
    /** Abilities currently available to the team (e.g. FOCUS, DESPERATION). */
    List<String> teamUnlockedAbilities,
    /** Boss passive abilities active for current phase (e.g. CRUSH, FURY). */
    List<String> bossUnlockedAbilities,
    /** Full rounds cap; lose after this many completed team+boss cycles without a win. */
    int maxRounds,
    /**
     * Why the battle ended (null while IN_PROGRESS or legacy rows).
     * BOSS_DEFEATED, ALL_HEROES_DEFEATED, ROUND_LIMIT.
     */
    String lossReason,
    boolean rewardClaimed,
    LocalDateTime createdAt,
    LocalDateTime endedAt,
    List<String> log
) {}
