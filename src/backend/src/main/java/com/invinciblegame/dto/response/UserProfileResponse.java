package com.invinciblegame.dto.response;

public record UserProfileResponse(
    Long id,
    String username,
    String email,
    String role,
    Integer energy,
    Integer maxEnergy,
    /** ISO-8601 local date-time when the next +1 energy is granted; null if energy is full. */
    String nextEnergyAt,
    /** Seconds until next +1 energy (0 if due now); null if energy is full. */
    Long secondsUntilNextEnergy,
    boolean hardcoreUnlocked,
    int clearedBosses,
    int totalBosses
) {}
