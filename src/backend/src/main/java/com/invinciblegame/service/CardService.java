package com.invinciblegame.service;

import com.invinciblegame.domain.entity.CharacterCard;
import com.invinciblegame.domain.entity.UserCharacter;
import com.invinciblegame.dto.response.CardResponse;
import com.invinciblegame.exception.ApiException;
import com.invinciblegame.mapper.CardMapper;
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
    private final CardMapper cardMapper;

    public CardService(
        CharacterCardRepository cardRepository,
        UserCharacterRepository userCharacterRepository,
        CurrentUserService currentUserService,
        CardMapper cardMapper
    ) {
        this.cardRepository = cardRepository;
        this.userCharacterRepository = userCharacterRepository;
        this.currentUserService = currentUserService;
        this.cardMapper = cardMapper;
    }

    public List<CardResponse> getCards(boolean ownedOnly) {
        var user = currentUserService.requireCurrentUser();
        if (ownedOnly) {
            return userCharacterRepository.findByUser(user).stream()
                .map(uc -> cardMapper.toResponse(uc.getCharacter(), true, uc))
                .toList();
        }
        var ownedMap = userCharacterRepository.findByUser(user).stream()
            .collect(java.util.stream.Collectors.toMap(uc -> uc.getCharacter().getId(), uc -> uc));
        return cardRepository.findAll().stream()
            .map(card -> {
                UserCharacter uc = ownedMap.get(card.getId());
                return cardMapper.toResponse(card, uc != null, uc);
            })
            .toList();
    }

    public CardResponse getCard(Long id) {
        var user = currentUserService.requireCurrentUser();
        CharacterCard card = cardRepository.findById(id)
            .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Card not found"));
        UserCharacter uc = userCharacterRepository.findByUserIdAndCharacterId(user.getId(), id).orElse(null);
        return cardMapper.toResponse(card, uc != null, uc);
    }
}
