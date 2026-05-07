package com.invinciblegame.service;

import com.invinciblegame.domain.entity.CharacterCard;
import com.invinciblegame.domain.entity.User;
import com.invinciblegame.domain.entity.UserCharacter;
import com.invinciblegame.dto.response.CardResponse;
import com.invinciblegame.mapper.CardMapper;
import com.invinciblegame.repository.UserCharacterRepository;
import java.util.List;
import org.springframework.stereotype.Service;

@Service
public class RewardService {
    private final UserCharacterRepository userCharacterRepository;
    private final CardMapper cardMapper;

    public RewardService(UserCharacterRepository userCharacterRepository, CardMapper cardMapper) {
        this.userCharacterRepository = userCharacterRepository;
        this.cardMapper = cardMapper;
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
                return cardMapper.toResponse(card, uc != null, uc);
            })
            .toList();
    }

    public CardResponse toResponse(CharacterCard card, boolean owned, UserCharacter uc) {
        return cardMapper.toResponse(card, owned, uc);
    }

    public CardResponse toResponse(CharacterCard card, boolean owned) {
        return cardMapper.toResponse(card, owned);
    }
}
