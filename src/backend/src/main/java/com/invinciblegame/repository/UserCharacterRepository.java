package com.invinciblegame.repository;

import com.invinciblegame.domain.entity.User;
import com.invinciblegame.domain.entity.UserCharacter;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface UserCharacterRepository extends JpaRepository<UserCharacter, Long> {
    List<UserCharacter> findByUser(User user);
    Optional<UserCharacter> findByUserIdAndCharacterId(Long userId, Long characterId);
    boolean existsByUserIdAndCharacterId(Long userId, Long characterId);
}
