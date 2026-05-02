package com.invinciblegame.repository;

import com.invinciblegame.domain.entity.Deck;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface DeckRepository extends JpaRepository<Deck, Long> {
    List<Deck> findByUserId(Long userId);
    long countByUserId(Long userId);
    boolean existsByUserIdAndSlotNumber(Long userId, Integer slotNumber);
}
