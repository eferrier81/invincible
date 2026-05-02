package com.invinciblegame.repository;

import com.invinciblegame.domain.entity.BattleTurn;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface BattleTurnRepository extends JpaRepository<BattleTurn, Long> {
    List<BattleTurn> findByBattleIdOrderByTurnNumberAsc(Long battleId);
}
