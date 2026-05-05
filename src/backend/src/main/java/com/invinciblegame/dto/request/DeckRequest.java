package com.invinciblegame.dto.request;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.util.List;

public record DeckRequest(
    @NotBlank String name,
    String description,
    @NotNull @Size(min = 3, max = 3) List<Long> characterIds,
    @NotNull @Min(1) @Max(3) Integer slotNumber
) {}
