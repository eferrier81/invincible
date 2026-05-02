package com.invinciblegame.dto.request;

import com.invinciblegame.domain.enums.ActionType;
import jakarta.validation.constraints.NotNull;

public record BattleActionRequest(
    @NotNull Long actorId,
    @NotNull ActionType actionType,
    Long skillId,
    @NotNull Long targetId
) {}
