package com.invinciblegame.service;

import com.invinciblegame.domain.entity.CharacterCard;
import com.invinciblegame.dto.response.CardResponse;
import com.invinciblegame.exception.ApiException;
import com.invinciblegame.repository.CharacterCardRepository;
import com.invinciblegame.repository.UserCharacterRepository;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

@Service
public class CardService {
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
                .map(uc -> toResponse(uc.getCharacter(), true))
                .toList();
        }
        return cardRepository.findAll().stream()
            .map(card -> toResponse(card, userCharacterRepository.existsByUserIdAndCharacterId(user.getId(), card.getId())))
            .toList();
    }

    public CardResponse getCard(Long id) {
        var user = currentUserService.requireCurrentUser();
        CharacterCard card = cardRepository.findById(id)
            .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Card not found"));
        boolean owned = userCharacterRepository.existsByUserIdAndCharacterId(user.getId(), id);
        return toResponse(card, owned);
    }

    private CardResponse toResponse(CharacterCard card, boolean owned) {
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
            card.getImageUrl()
        );
    }
}
