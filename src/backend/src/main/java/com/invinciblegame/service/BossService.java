package com.invinciblegame.service;

import com.invinciblegame.domain.entity.Boss;
import com.invinciblegame.dto.response.BossResponse;
import com.invinciblegame.exception.ApiException;
import com.invinciblegame.repository.BossRepository;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

@Service
public class BossService {
    private final BossRepository bossRepository;

    public BossService(BossRepository bossRepository) {
        this.bossRepository = bossRepository;
    }

    public List<BossResponse> findAll() {
        return bossRepository.findAll().stream().map(this::toResponse).toList();
    }

    public BossResponse findById(Long id) {
        Boss boss = bossRepository.findById(id)
            .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Boss not found"));
        return toResponse(boss);
    }

    private BossResponse toResponse(Boss boss) {
        return new BossResponse(
            boss.getId(),
            boss.getName(),
            boss.getDifficulty() != null ? boss.getDifficulty().name() : null,
            boss.getMaxHp(),
            boss.getAttack(),
            boss.getDefense(),
            boss.getSpeed(),
            boss.getHardcoreMultiplier(),
            boss.getDescription()
        );
    }
}
