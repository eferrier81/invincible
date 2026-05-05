package com.invinciblegame.service;

import com.invinciblegame.domain.entity.Deck;
import com.invinciblegame.dto.request.DeckRequest;
import com.invinciblegame.dto.response.DeckResponse;
import com.invinciblegame.exception.ApiException;
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

    public DeckService(
        DeckRepository deckRepository,
        CharacterCardRepository cardRepository,
        UserCharacterRepository userCharacterRepository,
        CurrentUserService currentUserService
    ) {
        this.deckRepository = deckRepository;
        this.cardRepository = cardRepository;
        this.userCharacterRepository = userCharacterRepository;
        this.currentUserService = currentUserService;
    }

    public List<DeckResponse> findAll() {
        Long userId = currentUserService.requireCurrentUser().getId();
        return deckRepository.findByUserId(userId).stream().map(this::toResponse).toList();
    }

    public DeckResponse create(DeckRequest request) {
        var user = currentUserService.requireCurrentUser();
        validateDeckRequest(user.getId(), request, null);
        Deck deck = new Deck();
        deck.setUser(user);
        updateDeckFromRequest(deck, request);
        return toResponse(deckRepository.save(deck));
    }

    public DeckResponse update(Long id, DeckRequest request) {
        var user = currentUserService.requireCurrentUser();
        Deck deck = deckRepository.findById(id)
            .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Deck not found"));
        if (!deck.getUser().getId().equals(user.getId())) {
            throw new ApiException(HttpStatus.FORBIDDEN, "Cannot edit another user's deck");
        }
        validateDeckRequest(user.getId(), request, id);
        updateDeckFromRequest(deck, request);
        return toResponse(deckRepository.save(deck));
    }

    public void delete(Long id) {
        var user = currentUserService.requireCurrentUser();
        Deck deck = deckRepository.findById(id)
            .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Deck not found"));
        if (!deck.getUser().getId().equals(user.getId())) {
            throw new ApiException(HttpStatus.FORBIDDEN, "Cannot delete another user's deck");
        }
        deckRepository.delete(deck);
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

    private DeckResponse toResponse(Deck deck) {
        return new DeckResponse(
            deck.getId(),
            deck.getName(),
            deck.getDescription(),
            deck.getSlotNumber(),
            deck.getCharacters().stream().map(c -> c.getId()).toList()
        );
    }
}
