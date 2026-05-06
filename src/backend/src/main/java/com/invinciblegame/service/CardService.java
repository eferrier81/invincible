package com.invinciblegame.service;

import com.invinciblegame.domain.entity.CharacterCard;
import com.invinciblegame.domain.entity.UserCharacter;
import com.invinciblegame.dto.response.CardResponse;
import com.invinciblegame.exception.ApiException;
import com.invinciblegame.repository.CharacterCardRepository;
import com.invinciblegame.repository.UserCharacterRepository;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

@Service
public class CardService {
    private static final int PASSIVE_UNLOCK_LEVEL = 5;

    private final CharacterCardRepository cardRepository;
    private final UserCharacterRepository userCharacterRepository;
    private final CurrentUserService currentUserService;

    public CardService(
        CharacterCardRepository cardRepository,
        UserCharacterRepository userCharacterRepository,
        CurrentUserService currentUserService
    ) {
        this.cardRepository = cardRepository;
        this.userCharacterRepository = userCharacterRepository;
        this.currentUserService = currentUserService;
    }

    public List<CardResponse> getCards(boolean ownedOnly) {
        var user = currentUserService.requireCurrentUser();
        if (ownedOnly) {
            return userCharacterRepository.findByUser(user).stream()
                .map(uc -> toResponse(uc.getCharacter(), true, uc))
                .toList();
        }
        var ownedMap = userCharacterRepository.findByUser(user).stream()
            .collect(java.util.stream.Collectors.toMap(uc -> uc.getCharacter().getId(), uc -> uc));
        return cardRepository.findAll().stream()
            .map(card -> {
                UserCharacter uc = ownedMap.get(card.getId());
                return toResponse(card, uc != null, uc);
            })
            .toList();
    }

    public CardResponse getCard(Long id) {
        var user = currentUserService.requireCurrentUser();
        CharacterCard card = cardRepository.findById(id)
            .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Card not found"));
        UserCharacter uc = userCharacterRepository.findByUserIdAndCharacterId(user.getId(), id).orElse(null);
        return toResponse(card, uc != null, uc);
    }

    private CardResponse toResponse(CharacterCard card, boolean owned, UserCharacter uc) {
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
}
