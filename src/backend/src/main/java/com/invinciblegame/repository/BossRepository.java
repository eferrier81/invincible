package com.invinciblegame.repository;

import com.invinciblegame.domain.entity.Boss;
import org.springframework.data.jpa.repository.JpaRepository;

public interface BossRepository extends JpaRepository<Boss, Long> {
}
