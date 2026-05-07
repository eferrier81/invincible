package com.invinciblegame.mapper;

import com.invinciblegame.domain.entity.CharacterCard;
import com.invinciblegame.domain.entity.UserCharacter;
import com.invinciblegame.dto.response.CardResponse;
import org.springframework.stereotype.Service;

@Service
public class CardMapper {
    private static final int PASSIVE_UNLOCK_LEVEL = 5;

    public CardResponse toResponse(CharacterCard card, boolean owned, UserCharacter uc) {
        Integer dup = uc != null ? uc.getDuplicateCount() : null;
        Integer upgrade = uc != null ? uc.getAbilityUpgradeIndex() : null;
        Integer level = uc != null ? uc.getLevel() : null;
        String passiveKey = level != null && level >= PASSIVE_UNLOCK_LEVEL ? card.getPassiveKey() : null;
        String passiveValue = level != null && level >= PASSIVE_UNLOCK_LEVEL ? card.getPassiveValue() : null;
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
            level,
            passiveKey,
            passiveValue,
            card.getImageUrl()
        );
    }

    public CardResponse toResponse(CharacterCard card, boolean owned) {
        return toResponse(card, owned, null);
    }
}
