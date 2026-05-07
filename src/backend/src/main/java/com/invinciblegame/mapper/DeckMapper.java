package com.invinciblegame.mapper;

import com.invinciblegame.domain.entity.Deck;
import com.invinciblegame.dto.response.DeckResponse;
import org.springframework.stereotype.Service;

@Service
public class DeckMapper {
    public DeckResponse toResponse(Deck deck) {
        return new DeckResponse(
            deck.getId(),
            deck.getName(),
            deck.getDescription(),
            deck.getSlotNumber(),
            deck.getCharacters().stream().map(c -> c.getId()).toList()
        );
    }
}
