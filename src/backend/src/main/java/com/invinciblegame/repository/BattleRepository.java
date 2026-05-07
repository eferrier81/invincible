package com.invinciblegame.repository;

import com.invinciblegame.domain.entity.Battle;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface BattleRepository extends JpaRepository<Battle, Long> {
    List<Battle> findByUserIdOrderByCreatedAtDesc(Long userId);

    @Query("select count(distinct b.boss.id) from Battle b where b.user.id = :userId and b.result = 'WIN' and b.isHardcore = false")
    long countDistinctNormalWins(@Param("userId") Long userId);

    List<Battle> findByDeckId(Long deckId);
}
