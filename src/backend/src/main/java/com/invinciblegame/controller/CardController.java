package com.invinciblegame.controller;

import com.invinciblegame.dto.response.CardResponse;
import com.invinciblegame.service.CardService;
import java.util.List;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/cards")
public class CardController {
    private final CardService cardService;

    public CardController(CardService cardService) {
        this.cardService = cardService;
    }

    @GetMapping
    public List<CardResponse> getCards(@RequestParam(defaultValue = "false") boolean owned) {
        return cardService.getCards(owned);
    }

    @GetMapping("/{id}")
    public CardResponse getCard(@PathVariable Long id) {
        return cardService.getCard(id);
    }
}
