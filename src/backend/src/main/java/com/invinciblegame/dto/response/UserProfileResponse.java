package com.invinciblegame.dto.response;

public record UserProfileResponse(
    Long id,
    String username,
    String email,
    String role,
    Integer energy
) {}
