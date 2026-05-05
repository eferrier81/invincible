package com.invinciblegame.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.invinciblegame.domain.battle.BattleAllyRuntime;
import com.invinciblegame.domain.battle.BattleRuntimeState;
import com.invinciblegame.domain.entity.*;
import com.invinciblegame.domain.enums.ActionType;
import com.invinciblegame.domain.enums.BattleResult;
import com.invinciblegame.dto.request.BattleActionRequest;
import com.invinciblegame.dto.request.ClaimRewardRequest;
import com.invinciblegame.dto.request.StartBattleRequest;
import com.invinciblegame.dto.response.BattleAllyResponse;
import com.invinciblegame.dto.response.BattleResponse;
import com.invinciblegame.dto.response.CardResponse;
import com.invinciblegame.exception.ApiException;
import com.invinciblegame.repository.*;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class BattleService {
    private static final double SKILL_MULTIPLIER = 1.3;
    private static final double SKILL_UPGRADE_STEP = 0.05;
    private static final double SKILL_UPGRADE_CAP = 2.0;
    private static final double FOCUS_MULTIPLIER = 1.22;
    private static final double DESPERATION_MULTIPLIER = 1.58;
    private static final double BOSS_CRUSH_MULT = 1.25;
    private static final double BOSS_FURY_MULT = 1.30;

    /** Persisted in battle state JSON when the fight ends (API `lossReason`). */
    private static final String END_BOSS_DEFEATED = "BOSS_DEFEATED";
    private static final String END_ALL_HEROES_DEFEATED = "ALL_HEROES_DEFEATED";
    private static final String END_ROUND_LIMIT = "ROUND_LIMIT";

    private final BattleRepository battleRepository;
    private final BattleTurnRepository battleTurnRepository;
    private final BossRepository bossRepository;
    private final DeckRepository deckRepository;
    private final CharacterCardRepository cardRepository;
    private final UserCharacterRepository userCharacterRepository;
    private final UserRepository userRepository;
    private final CurrentUserService currentUserService;
    private final EnergyService energyService;
    private final PackService packService;
    private final RewardService rewardService;
    private final ObjectMapper objectMapper;

    public BattleService(
        BattleRepository battleRepository,
        BattleTurnRepository battleTurnRepository,
        BossRepository bossRepository,
        DeckRepository deckRepository,
        CharacterCardRepository cardRepository,
        UserCharacterRepository userCharacterRepository,
        UserRepository userRepository,
        CurrentUserService currentUserService,
        EnergyService energyService,
        PackService packService,
        RewardService rewardService,
        ObjectMapper objectMapper
    ) {
        this.battleRepository = battleRepository;
        this.battleTurnRepository = battleTurnRepository;
        this.bossRepository = bossRepository;
        this.deckRepository = deckRepository;
        this.cardRepository = cardRepository;
        this.userCharacterRepository = userCharacterRepository;
        this.userRepository = userRepository;
        this.currentUserService = currentUserService;
        this.energyService = energyService;
        this.packService = packService;
        this.rewardService = rewardService;
        this.objectMapper = objectMapper;
    }

    @Transactional
    public BattleResponse start(StartBattleRequest request) {
        User user = currentUserService.requireCurrentUser();
        energyService.syncRegeneration(user);
        user = userRepository.findById(user.getId()).orElseThrow();
        Deck deck = deckRepository.findById(request.deckId())
            .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Deck not found"));
        if (!deck.getUser().getId().equals(user.getId())) {
            throw new ApiException(HttpStatus.FORBIDDEN, "Deck does not belong to current user");
        }
        Boss boss = bossRepository.findById(request.bossId())
            .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Boss not found"));
        if (user.getEnergy() == null || user.getEnergy() < EnergyService.ENERGY_COST_PER_BATTLE) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Not enough energy");
        }

        List<CharacterCard> roster = new ArrayList<>(deck.getCharacters());
        if (roster.size() != 3) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Deck must contain exactly 3 characters for 3v1 battle");
        }
        roster.sort(Comparator.comparingInt((CharacterCard c) -> c.getSpeed() == null ? 0 : c.getSpeed()).reversed());

        user.setEnergy(user.getEnergy() - EnergyService.ENERGY_COST_PER_BATTLE);
        userRepository.save(user);

        int bossHp = request.isHardcore()
            ? (int) Math.round(boss.getMaxHp() * (boss.getHardcoreMultiplier() == null ? 1.5 : boss.getHardcoreMultiplier()))
            : boss.getMaxHp();

        BattleRuntimeState state = new BattleRuntimeState();
        state.setBossMaxHp(bossHp);
        state.setBossCurrentHp(bossHp);
        state.setRoundNumber(1);
        state.setActedThisRound(new HashSet<>());

        List<Long> order = new ArrayList<>();
        List<BattleAllyRuntime> allies = new ArrayList<>();
        for (CharacterCard c : roster) {
            order.add(c.getId());
            int maxHp = c.getMaxHp() == null ? 100 : c.getMaxHp();
            allies.add(new BattleAllyRuntime(
                c.getId(),
                c.getName(),
                maxHp,
                maxHp,
                c.getAttack() == null ? 10 : c.getAttack(),
                c.getDefense() == null ? 5 : c.getDefense(),
                c.getSpeed() == null ? 5 : c.getSpeed(),
                0
            ));
        }
        state.setInitiativeOrder(order);
        state.setAllies(allies);
        state.setExpectedCharacterId(nextExpectedAlly(state));

        Battle battle = new Battle();
        battle.setUser(user);
        battle.setBoss(boss);
        battle.setDeck(deck);
        battle.setHardcore(request.isHardcore());
        battle.setBossCurrentHp(state.getBossCurrentHp());
        battle.setTeamCurrentHp(state.sumTeamHp());
        battle.setBattleStateJson(writeState(state));
        battle = battleRepository.save(battle);

        return toResponse(battle, user.getId());
    }

    @Transactional
    public BattleResponse action(Long battleId, BattleActionRequest request) {
        User user = currentUserService.requireCurrentUser();
        Battle battle = findOwnedBattle(user.getId(), battleId);
        ensureInProgress(battle);

        BattleRuntimeState state = readState(battle);
        if (state.getExpectedCharacterId() == null) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "No pending player action");
        }
        if (!state.getExpectedCharacterId().equals(request.actorId())) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "It is not this character's turn");
        }
        if (!request.targetId().equals(battle.getBoss().getId())) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Player actions must target the boss");
        }

        BattleAllyRuntime actor = state.findAlly(request.actorId());
        if (actor == null || actor.getCurrentHp() <= 0) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Actor is not in the fight or is defeated");
        }

        if (request.actionType() == ActionType.PHASE_EVENT) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Invalid action type");
        }
        if (request.actionType() != ActionType.ATTACK
            && request.actionType() != ActionType.SKILL
            && request.actionType() != ActionType.FOCUS
            && request.actionType() != ActionType.DESPERATION) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Unsupported action type");
        }

        if (request.actionType() == ActionType.SKILL) {
            if (actor.getSkillCooldownRemaining() > 0) {
                throw new ApiException(HttpStatus.BAD_REQUEST, "Skill is on cooldown; use Attack or wait for more of this character's turns");
            }
        }

        int maxBossHp = state.getBossMaxHp();
        int phaseBeforeAction = BattleRuntimeState.computeBossPhase(state.getBossCurrentHp(), maxBossHp);
        if (request.actionType() == ActionType.FOCUS) {
            if (phaseBeforeAction < 2) {
                throw new ApiException(HttpStatus.BAD_REQUEST, "Focus unlocks when the boss is in phase 2 (≤ 2/3 HP)");
            }
        }
        if (request.actionType() == ActionType.DESPERATION) {
            if (phaseBeforeAction < 3) {
                throw new ApiException(HttpStatus.BAD_REQUEST, "Desperation unlocks when the boss is in phase 3 (≤ 1/3 HP)");
            }
            if (actor.isDesperationUsed()) {
                throw new ApiException(HttpStatus.BAD_REQUEST, "Desperation can only be used once per hero per battle");
            }
        }

        Boss boss = battle.getBoss();
        int bossDef = boss.getDefense() == null ? 5 : boss.getDefense();
        int hpBeforeHit = state.getBossCurrentHp();
        double mult = switch (request.actionType()) {
            case SKILL -> skillMultiplierFor(user.getId(), actor.getCharacterId());
            case FOCUS -> FOCUS_MULTIPLIER;
            case DESPERATION -> DESPERATION_MULTIPLIER;
            default -> 1.0;
        };
        int dmg = damage(actor.getAttack(), mult, bossDef);
        int hpAfterHit = Math.max(0, hpBeforeHit - dmg);
        state.setBossCurrentHp(hpAfterHit);
        battle.setBossCurrentHp(hpAfterHit);
        battle.setTurnsTaken(battle.getTurnsTaken() + 1);

        if (request.actionType() == ActionType.SKILL) {
            actor.setSkillCooldownRemaining(BattleRuntimeState.SKILL_COOLDOWN);
        } else {
            if (actor.getSkillCooldownRemaining() > 0) {
                actor.setSkillCooldownRemaining(actor.getSkillCooldownRemaining() - 1);
            }
        }
        if (request.actionType() == ActionType.DESPERATION) {
            actor.setDesperationUsed(true);
        }

        state.getActedThisRound().add(request.actorId());
        String actionLabel = switch (request.actionType()) {
            case SKILL -> "Skill";
            case FOCUS -> "Focus";
            case DESPERATION -> "Desperation";
            default -> "Attack";
        };
        saveTurn(
            battle,
            request.actorId(),
            request.actionType(),
            request.targetId(),
            dmg,
            actor.getName() + " used " + actionLabel + " for " + dmg + " damage to the boss."
        );

        emitBossPhaseTransitions(battle, state, hpBeforeHit, hpAfterHit);

        if (state.getBossCurrentHp() <= 0) {
            battle.setResult(BattleResult.WIN);
            battle.setEndedAt(LocalDateTime.now());
            state.setExpectedCharacterId(null);
            state.setLossReason(END_BOSS_DEFEATED);
            ensureRewardOptions(battle);
            syncAggregates(battle, state);
            battle.setBattleStateJson(writeState(state));
            return toResponse(battleRepository.save(battle), user.getId());
        }

        state.setExpectedCharacterId(nextExpectedAlly(state));

        if (state.getExpectedCharacterId() == null) {
            runBossTurn(battle, state);
            if (battle.getResult() != BattleResult.IN_PROGRESS) {
                syncAggregates(battle, state);
                battle.setBattleStateJson(writeState(state));
                return toResponse(battleRepository.save(battle), user.getId());
            }
            state.setRoundNumber(state.getRoundNumber() + 1);
            if (state.getRoundNumber() > BattleRuntimeState.MAX_ROUNDS) {
                battle.setResult(BattleResult.LOSE);
                battle.setEndedAt(LocalDateTime.now());
                state.setExpectedCharacterId(null);
                state.setLossReason(END_ROUND_LIMIT);
                state.setRoundNumber(BattleRuntimeState.MAX_ROUNDS);
                syncAggregates(battle, state);
                battle.setBattleStateJson(writeState(state));
                battle.setTurnsTaken(battle.getTurnsTaken() + 1);
                saveTurn(
                    battle,
                    boss.getId(),
                    ActionType.ATTACK,
                    boss.getId(),
                    0,
                    "Round limit (" + BattleRuntimeState.MAX_ROUNDS + ") — all heroes are overwhelmed. Defeat."
                );
                return toResponse(battleRepository.save(battle), user.getId());
            }
            state.setActedThisRound(new HashSet<>());
            state.setExpectedCharacterId(nextExpectedAlly(state));
        }

        syncAggregates(battle, state);
        battle.setBattleStateJson(writeState(state));
        return toResponse(battleRepository.save(battle), user.getId());
    }

    private void runBossTurn(Battle battle, BattleRuntimeState state) {
        Boss boss = battle.getBoss();
        BattleAllyRuntime target = pickBossTarget(state);
        if (target == null) {
            battle.setResult(BattleResult.LOSE);
            battle.setEndedAt(LocalDateTime.now());
            state.setExpectedCharacterId(null);
            state.setLossReason(END_ALL_HEROES_DEFEATED);
            return;
        }

        int bossAtk = boss.getAttack() == null ? 20 : boss.getAttack();
        int phase = BattleRuntimeState.computeBossPhase(state.getBossCurrentHp(), state.getBossMaxHp());
        double bossMult = 1.0;
        if (phase >= 2) {
            bossMult *= BOSS_CRUSH_MULT;
        }
        if (phase >= 3) {
            bossMult *= BOSS_FURY_MULT;
        }
        int dmg = damage(bossAtk, bossMult, target.getDefense());
        target.setCurrentHp(Math.max(0, target.getCurrentHp() - dmg));
        battle.setTurnsTaken(battle.getTurnsTaken() + 1);
        String bossTags = phase >= 3 ? " (Crush + Fury)" : phase >= 2 ? " (Crush)" : "";
        saveTurn(
            battle,
            boss.getId(),
            ActionType.ATTACK,
            target.getCharacterId(),
            dmg,
            "Boss hit " + target.getName() + " for " + dmg + bossTags + "."
        );

        if (state.allAlliesDead()) {
            battle.setResult(BattleResult.LOSE);
            battle.setEndedAt(LocalDateTime.now());
            state.setExpectedCharacterId(null);
            state.setLossReason(END_ALL_HEROES_DEFEATED);
        }
    }

    private static BattleAllyRuntime pickBossTarget(BattleRuntimeState state) {
        return state.getAllies().stream()
            .filter(a -> a.getCurrentHp() > 0)
            .min(Comparator.comparingInt(BattleAllyRuntime::getCurrentHp).thenComparing(BattleAllyRuntime::getCharacterId))
            .orElse(null);
    }

    private static Long nextExpectedAlly(BattleRuntimeState state) {
        return nextExpectedAllyAfter(state, state.getActedThisRound());
    }

    private static Long nextExpectedAllyAfter(BattleRuntimeState state, java.util.Set<Long> acted) {
        for (Long id : state.getInitiativeOrder()) {
            BattleAllyRuntime a = state.findAlly(id);
            if (a != null && a.getCurrentHp() > 0 && !acted.contains(id)) {
                return id;
            }
        }
        return null;
    }

    private void emitBossPhaseTransitions(Battle battle, BattleRuntimeState state, int hpBefore, int hpAfter) {
        int max = state.getBossMaxHp();
        int pBefore = BattleRuntimeState.computeBossPhase(hpBefore, max);
        int pAfter = hpAfter <= 0 ? 3 : BattleRuntimeState.computeBossPhase(hpAfter, max);
        for (int p = pBefore + 1; p <= pAfter && p <= 3; p++) {
            String msg = switch (p) {
                case 2 -> "Phase 2 — Boss HP in middle third: team unlocks Focus; boss gains Crush (+25% damage).";
                case 3 -> "Phase 3 — Boss HP in lowest third: team unlocks Desperation (once per hero); boss gains Fury (+30% more, stacks with Crush).";
                default -> null;
            };
            if (msg != null) {
                battle.setTurnsTaken(battle.getTurnsTaken() + 1);
                saveTurn(battle, battle.getBoss().getId(), ActionType.PHASE_EVENT, battle.getBoss().getId(), 0, msg);
            }
        }
    }

    private static int damage(int attack, double skillMultiplier, int defenderDefense) {
        return Math.max(1, (int) Math.round(attack * skillMultiplier - defenderDefense * 0.5));
    }

    private double skillMultiplierFor(Long userId, Long characterId) {
        int upgrades = userCharacterRepository.findByUserIdAndCharacterId(userId, characterId)
            .map(uc -> uc.getAbilityUpgradeIndex() == null ? 0 : uc.getAbilityUpgradeIndex())
            .orElse(0);
        double mult = SKILL_MULTIPLIER + (SKILL_UPGRADE_STEP * upgrades);
        return Math.min(mult, SKILL_UPGRADE_CAP);
    }

    private static List<String> teamAbilitiesForPhase(int phase) {
        List<String> list = new ArrayList<>();
        if (phase >= 2) {
            list.add("FOCUS");
        }
        if (phase >= 3) {
            list.add("DESPERATION");
        }
        return list;
    }

    private static List<String> bossAbilitiesForPhase(int phase) {
        List<String> list = new ArrayList<>();
        if (phase >= 2) {
            list.add("CRUSH");
        }
        if (phase >= 3) {
            list.add("FURY");
        }
        return list;
    }

    private void syncAggregates(Battle battle, BattleRuntimeState state) {
        battle.setBossCurrentHp(state.getBossCurrentHp());
        battle.setTeamCurrentHp(state.sumTeamHp());
    }

    public BattleResponse getById(Long battleId) {
        User user = currentUserService.requireCurrentUser();
        return toResponse(findOwnedBattle(user.getId(), battleId), user.getId());
    }

    public List<BattleResponse> history() {
        User user = currentUserService.requireCurrentUser();
        return battleRepository.findByUserIdOrderByCreatedAtDesc(user.getId()).stream()
            .map(battle -> toResponse(battle, user.getId()))
            .toList();
    }

    @Transactional
    public BattleResponse claimReward(Long battleId, ClaimRewardRequest request) {
        User user = currentUserService.requireCurrentUser();
        Battle battle = findOwnedBattle(user.getId(), battleId);
        if (battle.getResult() != BattleResult.WIN) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Rewards can be claimed only after a win");
        }
        if (battle.getRewardClaimed()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Reward already claimed");
        }
        ensureRewardOptions(battle);
        List<Long> optionIds = readRewardOptionIds(battle);
        if (!optionIds.contains(request.characterId())) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Reward must be selected from the battle pack");
        }
        CharacterCard card = cardRepository.findById(request.characterId())
            .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Reward character not found"));
        rewardService.grantCard(user, card);
        battle.setRewardClaimed(true);
        return toResponse(battleRepository.save(battle), user.getId());
    }

    private Battle findOwnedBattle(Long userId, Long battleId) {
        Battle battle = battleRepository.findById(battleId)
            .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Battle not found"));
        if (!battle.getUser().getId().equals(userId)) {
            throw new ApiException(HttpStatus.FORBIDDEN, "Battle does not belong to current user");
        }
        return battle;
    }

    private void ensureInProgress(Battle battle) {
        if (battle.getResult() != BattleResult.IN_PROGRESS) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Battle already finished");
        }
    }

    private void saveTurn(Battle battle, Long actorId, ActionType actionType, Long targetId, Integer damage, String description) {
        BattleTurn turn = new BattleTurn();
        turn.setBattle(battle);
        turn.setTurnNumber(battle.getTurnsTaken());
        turn.setActorId(actorId);
        turn.setActionType(actionType);
        turn.setTargetId(targetId);
        turn.setDamageDealt(damage);
        turn.setActionDescription(description);
        battleTurnRepository.save(turn);
    }

    private BattleRuntimeState readState(Battle battle) {
        if (battle.getBattleStateJson() == null || battle.getBattleStateJson().isBlank()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Battle state missing; start a new battle");
        }
        try {
            return objectMapper.readValue(battle.getBattleStateJson(), BattleRuntimeState.class);
        } catch (JsonProcessingException e) {
            throw new ApiException(HttpStatus.INTERNAL_SERVER_ERROR, "Corrupt battle state");
        }
    }

    private String writeState(BattleRuntimeState state) {
        try {
            return objectMapper.writeValueAsString(state);
        } catch (JsonProcessingException e) {
            throw new ApiException(HttpStatus.INTERNAL_SERVER_ERROR, "Cannot serialize battle state");
        }
    }

    private BattleResponse toResponse(Battle battle, Long userId) {
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

        if (battle.getBattleStateJson() != null && !battle.getBattleStateJson().isBlank()) {
            try {
                BattleRuntimeState s = objectMapper.readValue(battle.getBattleStateJson(), BattleRuntimeState.class);
                expected = s.getExpectedCharacterId();
                round = s.getRoundNumber();
                lossReason = s.getLossReason();
                bossMax = s.getBossMaxHp();
                int curHp = s.getBossCurrentHp();
                bossPhase = BattleRuntimeState.computeBossPhase(curHp, bossMax);
                teamUnlocked = teamAbilitiesForPhase(bossPhase);
                bossUnlocked = bossAbilitiesForPhase(bossPhase);
                Set<Long> allyIds = s.getAllies().stream()
                    .map(BattleAllyRuntime::getCharacterId)
                    .collect(Collectors.toSet());
                Map<Long, String> imageByCharacterId = cardRepository.findAllById(allyIds).stream()
                    .collect(Collectors.toMap(CharacterCard::getId, c -> c.getImageUrl(), (x, y) -> x));
                allies = s.getAllies().stream()
                    .map(a -> new BattleAllyResponse(
                        a.getCharacterId(),
                        a.getName(),
                        a.getCurrentHp(),
                        a.getMaxHp(),
                        a.getAttack(),
                        a.getDefense(),
                        a.getSpeed(),
                        a.getSkillCooldownRemaining(),
                        imageByCharacterId.get(a.getCharacterId()),
                        a.isDesperationUsed()
                    ))
                    .toList();
            } catch (JsonProcessingException ignored) {
                allies = List.of();
            }
        }

        if (lossReason == null && battle.getResult() == BattleResult.WIN) {
            lossReason = END_BOSS_DEFEATED;
        }

        if (battle.getResult() == BattleResult.WIN && !battle.getRewardClaimed()) {
            List<Long> optionIds = readRewardOptionIds(battle);
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

    private void ensureRewardOptions(Battle battle) {
        if (battle.getRewardOptionsJson() != null && !battle.getRewardOptionsJson().isBlank()) {
            return;
        }
        List<CharacterCard> pack = packService.generatePack(3, true);
        List<Long> ids = pack.stream().map(CharacterCard::getId).toList();
        battle.setRewardOptionsJson(writeRewardOptions(ids));
    }

    private List<Long> readRewardOptionIds(Battle battle) {
        if (battle.getRewardOptionsJson() == null || battle.getRewardOptionsJson().isBlank()) {
            return List.of();
        }
        try {
            return objectMapper.readValue(battle.getRewardOptionsJson(), new TypeReference<List<Long>>() {});
        } catch (JsonProcessingException e) {
            throw new ApiException(HttpStatus.INTERNAL_SERVER_ERROR, "Corrupt battle rewards");
        }
    }

    private String writeRewardOptions(List<Long> ids) {
        try {
            return objectMapper.writeValueAsString(ids);
        } catch (JsonProcessingException e) {
            throw new ApiException(HttpStatus.INTERNAL_SERVER_ERROR, "Cannot serialize battle rewards");
        }
    }
}
