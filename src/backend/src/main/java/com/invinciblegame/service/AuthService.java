package com.invinciblegame.service;

import com.invinciblegame.domain.entity.User;
import com.invinciblegame.domain.enums.Role;
import com.invinciblegame.dto.request.LoginRequest;
import com.invinciblegame.dto.request.RegisterRequest;
import com.invinciblegame.dto.response.AuthResponse;
import com.invinciblegame.dto.response.UserProfileResponse;
import com.invinciblegame.exception.ApiException;
import com.invinciblegame.repository.UserRepository;
import com.invinciblegame.security.JwtUtils;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class AuthService {
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtils jwtUtils;
    private final CurrentUserService currentUserService;

    public AuthService(
        UserRepository userRepository,
        PasswordEncoder passwordEncoder,
        JwtUtils jwtUtils,
        CurrentUserService currentUserService
    ) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtUtils = jwtUtils;
        this.currentUserService = currentUserService;
    }

    public AuthResponse register(RegisterRequest request) {
        if (userRepository.existsByUsername(request.username())) {
            throw new ApiException(HttpStatus.CONFLICT, "Username already exists");
        }
        if (userRepository.existsByEmail(request.email())) {
            throw new ApiException(HttpStatus.CONFLICT, "Email already exists");
        }
        User user = new User();
        user.setUsername(request.username());
        user.setEmail(request.email());
        user.setPasswordHash(passwordEncoder.encode(request.password()));
        user.setRole(Role.PLAYER);
        user = userRepository.save(user);
        return tokenResponse(user);
    }

    public AuthResponse login(LoginRequest request) {
        User user = userRepository.findByUsername(request.username())
            .orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "Invalid credentials"));
        if (!passwordEncoder.matches(request.password(), user.getPasswordHash())) {
            throw new ApiException(HttpStatus.UNAUTHORIZED, "Invalid credentials");
        }
        return tokenResponse(user);
    }

    public UserProfileResponse me() {
        User user = currentUserService.requireCurrentUser();
        return new UserProfileResponse(user.getId(), user.getUsername(), user.getEmail(), user.getRole().name(), user.getEnergy());
    }

    private AuthResponse tokenResponse(User user) {
        String token = jwtUtils.generateToken(user.getUsername(), user.getRole().name());
        return new AuthResponse(token, user.getUsername(), user.getRole().name());
    }
}
