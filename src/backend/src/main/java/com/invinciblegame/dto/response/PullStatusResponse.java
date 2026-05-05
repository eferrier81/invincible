package com.invinciblegame.dto.response;

public record PullStatusResponse(
    boolean welcomeAvailable,
    boolean dailyAvailable,
    /** ISO-8601 local date-time when next daily pull unlocks; null if available now. */
    String nextDailyAt
) {}
