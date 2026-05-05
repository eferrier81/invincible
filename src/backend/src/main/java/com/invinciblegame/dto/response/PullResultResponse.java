package com.invinciblegame.dto.response;

import java.util.List;

public record PullResultResponse(
    String type,
    List<CardResponse> cards,
    PullStatusResponse status
) {}
