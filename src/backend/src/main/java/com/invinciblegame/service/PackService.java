package com.invinciblegame.service;

import com.invinciblegame.domain.entity.CharacterCard;
import com.invinciblegame.domain.enums.Rarity;
import com.invinciblegame.exception.ApiException;
import com.invinciblegame.repository.CharacterCardRepository;
import java.util.ArrayList;
import java.util.EnumMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ThreadLocalRandom;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

@Service
public class PackService {
    private static final double RATE_LEGENDARY = 0.02;
    private static final double RATE_EPIC = 0.08;
    private static final double RATE_RARE = 0.20;
    private static final double RATE_COMMON = 0.70;

    private final CharacterCardRepository cardRepository;

    public PackService(CharacterCardRepository cardRepository) {
        this.cardRepository = cardRepository;
    }

    public List<CharacterCard> generatePack(int count, boolean allowLegendary) {
        if (count <= 0) {
            return List.of();
        }
        List<CharacterCard> playable = cardRepository.findByIsPlayableTrue();
        if (playable.isEmpty()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "No playable cards available for pulls");
        }
        Map<Rarity, List<CharacterCard>> byRarity = groupByRarity(playable);
        List<CharacterCard> result = new ArrayList<>();
        for (int i = 0; i < count; i++) {
            Rarity rarity = rollRarity(allowLegendary);
            CharacterCard picked = pickCard(byRarity, rarity);
            result.add(picked);
        }
        return result;
    }

    private static Map<Rarity, List<CharacterCard>> groupByRarity(List<CharacterCard> cards) {
        Map<Rarity, List<CharacterCard>> map = new EnumMap<>(Rarity.class);
        for (CharacterCard card : cards) {
            if (card.getRarity() == null) continue;
            map.computeIfAbsent(card.getRarity(), k -> new ArrayList<>()).add(card);
        }
        return map;
    }

    private static Rarity rollRarity(boolean allowLegendary) {
        double roll = ThreadLocalRandom.current().nextDouble();
        if (allowLegendary) {
            if (roll < RATE_LEGENDARY) return Rarity.LEGENDARY;
            if (roll < RATE_LEGENDARY + RATE_EPIC) return Rarity.EPIC;
            if (roll < RATE_LEGENDARY + RATE_EPIC + RATE_RARE) return Rarity.RARE;
            return Rarity.COMMON;
        }

        double total = RATE_EPIC + RATE_RARE + RATE_COMMON;
        double scaled = roll * total;
        if (scaled < RATE_EPIC) return Rarity.EPIC;
        if (scaled < RATE_EPIC + RATE_RARE) return Rarity.RARE;
        return Rarity.COMMON;
    }

    private static CharacterCard pickCard(Map<Rarity, List<CharacterCard>> byRarity, Rarity rarity) {
        List<CharacterCard> pool = byRarity.getOrDefault(rarity, List.of());
        if (!pool.isEmpty()) {
            return pickRandom(pool);
        }
        List<CharacterCard> fallback = byRarity.values().stream().flatMap(List::stream).toList();
        return pickRandom(fallback);
    }

    private static CharacterCard pickRandom(List<CharacterCard> pool) {
        if (pool.isEmpty()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "No playable cards available for pulls");
        }
        int idx = ThreadLocalRandom.current().nextInt(pool.size());
        return pool.get(idx);
    }
}
