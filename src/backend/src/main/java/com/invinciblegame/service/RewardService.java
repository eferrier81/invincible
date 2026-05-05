package com.invinciblegame.service;

import com.invinciblegame.domain.entity.CharacterCard;
import com.invinciblegame.domain.entity.User;
import com.invinciblegame.domain.entity.UserCharacter;
import com.invinciblegame.dto.response.CardResponse;
import com.invinciblegame.repository.UserCharacterRepository;
import java.util.List;
import org.springframework.stereotype.Service;

@Service
public class RewardService {
    private final UserCharacterRepository userCharacterRepository;

    public RewardService(UserCharacterRepository userCharacterRepository) {
        this.userCharacterRepository = userCharacterRepository;
    }

    public void grantCard(User user, CharacterCard card) {
        userCharacterRepository.findByUserIdAndCharacterId(user.getId(), card.getId())
            .ifPresentOrElse(existing -> {
                int currentDup = existing.getDuplicateCount() == null ? 0 : existing.getDuplicateCount();
                int currentUpgrade = existing.getAbilityUpgradeIndex() == null ? 0 : existing.getAbilityUpgradeIndex();
                existing.setDuplicateCount(currentDup + 1);
                existing.setAbilityUpgradeIndex(currentUpgrade + 1);
                userCharacterRepository.save(existing);
            }, () -> {
                UserCharacter uc = new UserCharacter();
                uc.setUser(user);
                uc.setCharacter(card);
                userCharacterRepository.save(uc);
            });
    }

    public List<CardResponse> toResponsesWithOwnership(Long userId, List<CharacterCard> cards) {
        return cards.stream()
            .map(card -> {
                var uc = userCharacterRepository.findByUserIdAndCharacterId(userId, card.getId()).orElse(null);
                return toResponse(card, uc != null, uc);
            })
            .toList();
    }

    public CardResponse toResponse(CharacterCard card, boolean owned, UserCharacter uc) {
        Integer dup = uc != null ? uc.getDuplicateCount() : null;
        Integer upgrade = uc != null ? uc.getAbilityUpgradeIndex() : null;
        return new CardResponse(
            card.getId(),
            card.getName(),
            card.getRarity() != null ? card.getRarity().name() : null,
            card.getFaction(),
            card.getMaxHp(),
            card.getAttack(),
            card.getDefense(),
            card.getSpeed(),
            owned,
            dup,
            upgrade,
            card.getImageUrl()
        );
    }

    public CardResponse toResponse(CharacterCard card, boolean owned) {
        return toResponse(card, owned, null);
    }
}
