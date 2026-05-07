package com.invinciblegame.mapper;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.invinciblegame.domain.battle.BattleAllyRuntime;
import com.invinciblegame.domain.battle.BattleRuntimeState;
import com.invinciblegame.domain.entity.Battle;
import com.invinciblegame.domain.entity.BattleTurn;
import com.invinciblegame.domain.entity.CharacterCard;
import com.invinciblegame.domain.enums.BattleResult;
import com.invinciblegame.dto.response.BattleAllyResponse;
import com.invinciblegame.dto.response.BattleResponse;
import com.invinciblegame.dto.response.CardResponse;
import com.invinciblegame.repository.BattleTurnRepository;
import com.invinciblegame.repository.CharacterCardRepository;
import com.invinciblegame.service.BattleRewardCodec;
import com.invinciblegame.service.RewardService;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;
import org.springframework.stereotype.Service;

@Service
public class BattleMapper {
    private static final int PASSIVE_UNLOCK_LEVEL = 5;
    private static final String END_BOSS_DEFEATED = "BOSS_DEFEATED";

    private final BattleTurnRepository battleTurnRepository;
    private final CharacterCardRepository cardRepository;
    private final RewardService rewardService;
    private final BattleRewardCodec rewardCodec;
    private final ObjectMapper objectMapper;

    public BattleMapper(
        BattleTurnRepository battleTurnRepository,
        CharacterCardRepository cardRepository,
        RewardService rewardService,
        BattleRewardCodec rewardCodec,
        ObjectMapper objectMapper
    ) {
        this.battleTurnRepository = battleTurnRepository;
        this.cardRepository = cardRepository;
        this.rewardService = rewardService;
        this.rewardCodec = rewardCodec;
        this.objectMapper = objectMapper;
    }

    public BattleResponse toResponse(Battle battle, Long userId) {
        List<String> log = battleTurnRepository.findByBattleIdOrderByTurnNumberAsc(battle.getId()).stream()
            .map(BattleTurn::getActionDescription)
            .toList();

        Long expected = null;
        int round = 1;
        List<BattleAllyResponse> allies = List.of();
        int bossMax = battle.getBoss() != null && battle.getBoss().getMaxHp() != null ? battle.getBoss().getMaxHp() : 0;
        String bossImageUrl = battle.getBoss() != null ? battle.getBoss().getImageUrl() : null;
        int bossPhase = 1;
        List<String> teamUnlocked = List.of();
        List<String> bossUnlocked = List.of();
        String lossReason = null;
        List<CardResponse> rewardOptions = List.of();

        BattleRuntimeState state = readState(battle.getBattleStateJson());
        if (state != null) {
            expected = state.getExpectedCharacterId();
            round = state.getRoundNumber();
            lossReason = state.getLossReason();
            bossMax = state.getBossMaxHp();
            int curHp = state.getBossCurrentHp();
            bossPhase = BattleRuntimeState.computeBossPhase(curHp, bossMax);
            teamUnlocked = teamAbilitiesForPhase(bossPhase);
            bossUnlocked = bossAbilitiesForPhase(bossPhase);
            allies = buildAllies(state);
        }

        if (lossReason == null && battle.getResult() == BattleResult.WIN) {
            lossReason = END_BOSS_DEFEATED;
        }

        if (battle.getResult() == BattleResult.WIN && !battle.getRewardClaimed()) {
            List<Long> optionIds = rewardCodec.readOptionIds(battle.getRewardOptionsJson());
            if (!optionIds.isEmpty()) {
                Map<Long, CharacterCard> byId = cardRepository.findAllById(optionIds).stream()
                    .collect(Collectors.toMap(CharacterCard::getId, c -> c, (a, b) -> a));
                List<CharacterCard> ordered = optionIds.stream()
                    .map(byId::get)
                    .filter(c -> c != null)
                    .toList();
                rewardOptions = rewardService.toResponsesWithOwnership(userId, ordered);
            }
        }

        return new BattleResponse(
            battle.getId(),
            battle.getBoss().getId(),
            battle.getDeck().getId(),
            battle.getResult().name(),
            battle.getHardcore(),
            battle.getTurnsTaken(),
            battle.getBossCurrentHp(),
            bossMax,
            bossImageUrl,
            battle.getTeamCurrentHp(),
            expected,
            round,
            allies,
            BattleRuntimeState.SKILL_COOLDOWN,
            bossPhase,
            teamUnlocked,
            bossUnlocked,
            BattleRuntimeState.MAX_ROUNDS,
            lossReason,
            rewardOptions,
            battle.getRewardClaimed(),
            battle.getCreatedAt(),
            battle.getEndedAt(),
            log
        );
    }

    private List<BattleAllyResponse> buildAllies(BattleRuntimeState state) {
        Set<Long> allyIds = state.getAllies().stream()
            .map(BattleAllyRuntime::getCharacterId)
            .collect(Collectors.toSet());
        Map<Long, CharacterCard> cardsById = cardRepository.findAllById(allyIds).stream()
            .collect(Collectors.toMap(CharacterCard::getId, c -> c, (x, y) -> x));
        return state.getAllies().stream()
            .map(a -> toAllyResponse(a, cardsById.get(a.getCharacterId())))
            .toList();
    }

    private BattleAllyResponse toAllyResponse(BattleAllyRuntime ally, CharacterCard card) {
        String imageUrl = card != null ? card.getImageUrl() : null;
        String passiveKey = ally.getLevel() >= PASSIVE_UNLOCK_LEVEL && card != null ? card.getPassiveKey() : null;
        String passiveValue = ally.getLevel() >= PASSIVE_UNLOCK_LEVEL && card != null ? card.getPassiveValue() : null;
        return new BattleAllyResponse(
            ally.getCharacterId(),
            ally.getName(),
            ally.getCurrentHp(),
            ally.getMaxHp(),
            ally.getAttack(),
            ally.getDefense(),
            ally.getSpeed(),
            ally.getSkillCooldownRemaining(),
            imageUrl,
            ally.isDesperationUsed(),
            ally.getLevel(),
            passiveKey,
            passiveValue
        );
    }

    private BattleRuntimeState readState(String json) {
        if (json == null || json.isBlank()) {
            return null;
        }
        try {
            return objectMapper.readValue(json, BattleRuntimeState.class);
        } catch (JsonProcessingException ignored) {
            return null;
        }
    }

    private static List<String> teamAbilitiesForPhase(int phase) {
        if (phase < 2) {
            return List.of();
        }
        if (phase < 3) {
            return List.of("FOCUS");
        }
        return List.of("FOCUS", "DESPERATION");
    }

    private static List<String> bossAbilitiesForPhase(int phase) {
        if (phase < 2) {
            return List.of();
        }
        if (phase < 3) {
            return List.of("CRUSH");
        }
        return List.of("CRUSH", "FURY");
    }
}
