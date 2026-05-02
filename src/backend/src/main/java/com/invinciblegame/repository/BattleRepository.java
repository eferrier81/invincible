package com.invinciblegame.repository;

import com.invinciblegame.domain.entity.Battle;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface BattleRepository extends JpaRepository<Battle, Long> {
    List<Battle> findByUserIdOrderByCreatedAtDesc(Long userId);
}
