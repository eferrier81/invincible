package com.invinciblegame.dto.response;

import java.util.List;

public record DeckResponse(
    Long id,
    String name,
    String description,
    Integer slotNumber,
    List<Long> characterIds
) {}
