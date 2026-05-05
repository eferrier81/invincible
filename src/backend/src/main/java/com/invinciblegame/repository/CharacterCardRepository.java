package com.invinciblegame.repository;

import com.invinciblegame.domain.entity.CharacterCard;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CharacterCardRepository extends JpaRepository<CharacterCard, Long> {
	List<CharacterCard> findByIsPlayableTrue();
}
