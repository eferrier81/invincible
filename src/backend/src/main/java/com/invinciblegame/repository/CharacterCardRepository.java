package com.invinciblegame.repository;

import com.invinciblegame.domain.entity.CharacterCard;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CharacterCardRepository extends JpaRepository<CharacterCard, Long> {
}
