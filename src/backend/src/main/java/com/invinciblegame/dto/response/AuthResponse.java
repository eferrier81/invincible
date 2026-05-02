package com.invinciblegame.dto.response;

public record AuthResponse(
    String token,
    String username,
    String role
) {}
