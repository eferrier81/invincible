package com.invinciblegame.controller;

import com.invinciblegame.dto.request.DeckRequest;
import com.invinciblegame.dto.response.DeckResponse;
import com.invinciblegame.service.DeckService;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/decks")
public class DeckController {
    private final DeckService deckService;

    public DeckController(DeckService deckService) {
        this.deckService = deckService;
    }

    @GetMapping
    public List<DeckResponse> getDecks() {
        return deckService.findAll();
    }

    @PostMapping
    public DeckResponse createDeck(@Valid @RequestBody DeckRequest request) {
        return deckService.create(request);
    }

    @PutMapping("/{id}")
    public DeckResponse updateDeck(@PathVariable Long id, @Valid @RequestBody DeckRequest request) {
        return deckService.update(id, request);
    }

    @DeleteMapping("/{id}")
    public void deleteDeck(@PathVariable Long id) {
        deckService.delete(id);
    }
}
