package com.invinciblegame.service;

import com.invinciblegame.domain.entity.Deck;
import com.invinciblegame.dto.request.DeckRequest;
import com.invinciblegame.dto.response.DeckResponse;
import com.invinciblegame.exception.ApiException;
import com.invinciblegame.mapper.DeckMapper;
import com.invinciblegame.repository.CharacterCardRepository;
import com.invinciblegame.repository.DeckRepository;
import com.invinciblegame.repository.UserCharacterRepository;
import java.util.HashSet;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

@Service
public class DeckService {
    private final DeckRepository deckRepository;
    private final CharacterCardRepository cardRepository;
    private final UserCharacterRepository userCharacterRepository;
    private final CurrentUserService currentUserService;
    private final DeckMapper deckMapper;

    public DeckService(
        DeckRepository deckRepository,
        CharacterCardRepository cardRepository,
        UserCharacterRepository userCharacterRepository,
        CurrentUserService currentUserService,
        DeckMapper deckMapper
    ) {
        this.deckRepository = deckRepository;
        this.cardRepository = cardRepository;
        this.userCharacterRepository = userCharacterRepository;
        this.currentUserService = currentUserService;
        this.deckMapper = deckMapper;
    }

    public List<DeckResponse> findAll() {
        Long userId = currentUserService.requireCurrentUser().getId();
        return deckRepository.findByUserId(userId).stream().map(deckMapper::toResponse).toList();
    }

    public DeckResponse create(DeckRequest request) {
        var user = currentUserService.requireCurrentUser();
        validateDeckRequest(user.getId(), request, null);
        Deck deck = new Deck();
        deck.setUser(user);
        updateDeckFromRequest(deck, request);
        return deckMapper.toResponse(deckRepository.save(deck));
    }

    public DeckResponse update(Long id, DeckRequest request) {
        var user = currentUserService.requireCurrentUser();
        Deck deck = findOwnedDeck(user.getId(), id, "Cannot edit another user's deck");
        validateDeckRequest(user.getId(), request, id);
        updateDeckFromRequest(deck, request);
        return deckMapper.toResponse(deckRepository.save(deck));
    }

    public void delete(Long id) {
        var user = currentUserService.requireCurrentUser();
        Deck deck = findOwnedDeck(user.getId(), id, "Cannot delete another user's deck");
        deckRepository.delete(deck);
    }

    private Deck findOwnedDeck(Long userId, Long deckId, String forbiddenMessage) {
        Deck deck = deckRepository.findById(deckId)
            .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Deck not found"));
        if (!deck.getUser().getId().equals(userId)) {
            throw new ApiException(HttpStatus.FORBIDDEN, forbiddenMessage);
        }
        return deck;
    }

    private void validateDeckRequest(Long userId, DeckRequest request, Long existingDeckId) {
        if (request.characterIds() == null || request.characterIds().size() != 3) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Deck must contain exactly 3 characters");
        }
        if (new HashSet<>(request.characterIds()).size() != 3) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Deck must contain exactly 3 distinct characters");
        }
        for (Long cardId : request.characterIds()) {
            if (!userCharacterRepository.existsByUserIdAndCharacterId(userId, cardId)) {
                throw new ApiException(HttpStatus.BAD_REQUEST, "Deck contains character not owned by user");
            }
        }
        if (existingDeckId == null && deckRepository.countByUserId(userId) >= 3) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Maximum 3 decks allowed");
        }
        if (request.slotNumber() == null) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Slot number is required");
        }
        boolean slotTaken = existingDeckId == null
            ? deckRepository.existsByUserIdAndSlotNumber(userId, request.slotNumber())
            : deckRepository.existsByUserIdAndSlotNumberAndIdNot(userId, request.slotNumber(), existingDeckId);
        if (slotTaken) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Slot already used");
        }
    }

    private void updateDeckFromRequest(Deck deck, DeckRequest request) {
        deck.setName(request.name());
        deck.setDescription(request.description());
        deck.setSlotNumber(request.slotNumber());
        deck.setCharacters(new HashSet<>(cardRepository.findAllById(request.characterIds())));
    }

}
