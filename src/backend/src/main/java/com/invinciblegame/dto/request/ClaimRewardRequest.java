package com.invinciblegame.dto.request;

import jakarta.validation.constraints.NotNull;

public record ClaimRewardRequest(
    @NotNull Long characterId
) {}
