package com.invinciblegame.service;

import com.invinciblegame.domain.entity.*;
import com.invinciblegame.domain.enums.ActionType;
import com.invinciblegame.domain.enums.BattleResult;
import com.invinciblegame.dto.request.BattleActionRequest;
import com.invinciblegame.dto.request.ClaimRewardRequest;
import com.invinciblegame.dto.request.StartBattleRequest;
import com.invinciblegame.dto.response.BattleResponse;
import com.invinciblegame.exception.ApiException;
import com.invinciblegame.repository.*;
import java.time.LocalDateTime;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class BattleService {
    private final BattleRepository battleRepository;
    private final BattleTurnRepository battleTurnRepository;
    private final BossRepository bossRepository;
    private final DeckRepository deckRepository;
    private final CharacterCardRepository cardRepository;
    private final UserCharacterRepository userCharacterRepository;
    private final CurrentUserService currentUserService;

    public BattleService(
        BattleRepository battleRepository,
        BattleTurnRepository battleTurnRepository,
        BossRepository bossRepository,
        DeckRepository deckRepository,
        CharacterCardRepository cardRepository,
        UserCharacterRepository userCharacterRepository,
        CurrentUserService currentUserService
    ) {
        this.battleRepository = battleRepository;
        this.battleTurnRepository = battleTurnRepository;
        this.bossRepository = bossRepository;
        this.deckRepository = deckRepository;
        this.cardRepository = cardRepository;
        this.userCharacterRepository = userCharacterRepository;
        this.currentUserService = currentUserService;
    }

    @Transactional
    public BattleResponse start(StartBattleRequest request) {
        User user = currentUserService.requireCurrentUser();
        Deck deck = deckRepository.findById(request.deckId())
            .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Deck not found"));
        if (!deck.getUser().getId().equals(user.getId())) {
            throw new ApiException(HttpStatus.FORBIDDEN, "Deck does not belong to current user");
        }
        Boss boss = bossRepository.findById(request.bossId())
            .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Boss not found"));
        if (user.getEnergy() <= 0) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Not enough energy");
        }
        user.setEnergy(user.getEnergy() - 1);

        int teamHp = deck.getCharacters().stream().mapToInt(c -> c.getMaxHp() == null ? 100 : c.getMaxHp()).sum();
        int bossHp = request.isHardcore() ? (int) Math.round(boss.getMaxHp() * boss.getHardcoreMultiplier()) : boss.getMaxHp();

        Battle battle = new Battle();
        battle.setUser(user);
        battle.setBoss(boss);
        battle.setDeck(deck);
        battle.setHardcore(request.isHardcore());
        battle.setTeamCurrentHp(teamHp);
        battle.setBossCurrentHp(bossHp);
        return toResponse(battleRepository.save(battle));
    }

    @Transactional
    public BattleResponse action(Long battleId, BattleActionRequest request) {
        User user = currentUserService.requireCurrentUser();
        Battle battle = findOwnedBattle(user.getId(), battleId);
        ensureInProgress(battle);

        int playerAttack = battle.getDeck().getCharacters().stream().mapToInt(c -> c.getAttack() == null ? 10 : c.getAttack()).sum() / 3;
        int bossDefense = battle.getBoss().getDefense() == null ? 5 : battle.getBoss().getDefense();
        double multiplier = request.actionType() == ActionType.SKILL ? 1.3 : 1.0;
        int playerDamage = Math.max(1, (int) Math.round(playerAttack * multiplier - bossDefense * 0.5));
        battle.setBossCurrentHp(Math.max(0, battle.getBossCurrentHp() - playerDamage));
        battle.setTurnsTaken(battle.getTurnsTaken() + 1);
        saveTurn(battle, request.actorId(), request.actionType(), request.targetId(), playerDamage, "Player dealt " + playerDamage + " damage.");

        if (battle.getBossCurrentHp() <= 0) {
            battle.setResult(BattleResult.WIN);
            battle.setEndedAt(LocalDateTime.now());
            return toResponse(battleRepository.save(battle));
        }

        int bossAttack = battle.getBoss().getAttack() == null ? 20 : battle.getBoss().getAttack();
        int teamDefense = battle.getDeck().getCharacters().stream().mapToInt(c -> c.getDefense() == null ? 5 : c.getDefense()).sum() / 3;
        int bossDamage = Math.max(1, (int) Math.round(bossAttack - teamDefense * 0.5));
        battle.setTeamCurrentHp(Math.max(0, battle.getTeamCurrentHp() - bossDamage));
        saveTurn(battle, battle.getBoss().getId(), ActionType.ATTACK, request.actorId(), bossDamage, "Boss dealt " + bossDamage + " damage.");

        if (battle.getTeamCurrentHp() <= 0 || battle.getTurnsTaken() >= 50) {
            battle.setResult(BattleResult.LOSE);
            battle.setEndedAt(LocalDateTime.now());
        }
        return toResponse(battleRepository.save(battle));
    }

    public BattleResponse getById(Long battleId) {
        User user = currentUserService.requireCurrentUser();
        return toResponse(findOwnedBattle(user.getId(), battleId));
    }

    public List<BattleResponse> history() {
        User user = currentUserService.requireCurrentUser();
        return battleRepository.findByUserIdOrderByCreatedAtDesc(user.getId()).stream().map(this::toResponse).toList();
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
        CharacterCard card = cardRepository.findById(request.characterId())
            .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Reward character not found"));

        userCharacterRepository.findByUserIdAndCharacterId(user.getId(), card.getId())
            .ifPresentOrElse(existing -> {
                existing.setDuplicateCount(existing.getDuplicateCount() + 1);
                existing.setAbilityUpgradeIndex(existing.getAbilityUpgradeIndex() + 1);
                userCharacterRepository.save(existing);
            }, () -> {
                UserCharacter uc = new UserCharacter();
                uc.setUser(user);
                uc.setCharacter(card);
                userCharacterRepository.save(uc);
            });

        battle.setRewardClaimed(true);
        return toResponse(battleRepository.save(battle));
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

    private BattleResponse toResponse(Battle battle) {
        List<String> log = battleTurnRepository.findByBattleIdOrderByTurnNumberAsc(battle.getId()).stream()
            .map(BattleTurn::getActionDescription)
            .toList();
        return new BattleResponse(
            battle.getId(),
            battle.getBoss().getId(),
            battle.getDeck().getId(),
            battle.getResult().name(),
            battle.getHardcore(),
            battle.getTurnsTaken(),
            battle.getBossCurrentHp(),
            battle.getTeamCurrentHp(),
            battle.getRewardClaimed(),
            battle.getCreatedAt(),
            battle.getEndedAt(),
            log
        );
    }
}
