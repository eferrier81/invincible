package com.invinciblegame.dto.request;

import jakarta.validation.constraints.NotNull;

public record StartBattleRequest(
    @NotNull Long bossId,
    @NotNull Long deckId,
    @NotNull Boolean isHardcore
) {}
