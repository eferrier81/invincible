package com.invinciblegame.domain.battle;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

@JsonIgnoreProperties(ignoreUnknown = true)
public class BattleRuntimeState {
    /** Character IDs in initiative order (speed desc). Boss acts after all living allies have acted. */
    private List<Long> initiativeOrder = new ArrayList<>();
    private List<BattleAllyRuntime> allies = new ArrayList<>();
    private int bossCurrentHp;
    private int bossMaxHp;
    /** Which ally must act next; null only when battle is over. */
    private Long expectedCharacterId;
    private Set<Long> actedThisRound = new HashSet<>();
    private int roundNumber = 1;
    /** Set when the battle ends: BOSS_DEFEATED, ALL_HEROES_DEFEATED, ROUND_LIMIT. */
    private String lossReason;
    public static final int SKILL_COOLDOWN = 2;
    public static final int MAX_ROUNDS = 50;

    /**
     * Boss HP split in thirds (integer bounds): phase 1 upper, phase 2 middle, phase 3 lower.
     * At 0 HP returns 3 for UI consistency.
     */
    public static int computeBossPhase(int currentHp, int maxHp) {
        if (maxHp <= 0) {
            return 1;
        }
        if (currentHp <= 0) {
            return 3;
        }
        int tLow = maxHp / 3;
        int tHigh = (2 * maxHp) / 3;
        if (currentHp > tHigh) {
            return 1;
        }
        if (currentHp > tLow) {
            return 2;
        }
        return 3;
    }

    public List<Long> getInitiativeOrder() { return initiativeOrder; }
    public void setInitiativeOrder(List<Long> initiativeOrder) { this.initiativeOrder = initiativeOrder; }
    public List<BattleAllyRuntime> getAllies() { return allies; }
    public void setAllies(List<BattleAllyRuntime> allies) { this.allies = allies; }
    public int getBossCurrentHp() { return bossCurrentHp; }
    public void setBossCurrentHp(int bossCurrentHp) { this.bossCurrentHp = bossCurrentHp; }
    public int getBossMaxHp() { return bossMaxHp; }
    public void setBossMaxHp(int bossMaxHp) { this.bossMaxHp = bossMaxHp; }
    public Long getExpectedCharacterId() { return expectedCharacterId; }
    public void setExpectedCharacterId(Long expectedCharacterId) { this.expectedCharacterId = expectedCharacterId; }
    public Set<Long> getActedThisRound() { return actedThisRound; }
    public void setActedThisRound(Set<Long> actedThisRound) { this.actedThisRound = actedThisRound; }
    public int getRoundNumber() { return roundNumber; }
    public void setRoundNumber(int roundNumber) { this.roundNumber = roundNumber; }
    public String getLossReason() { return lossReason; }
    public void setLossReason(String lossReason) { this.lossReason = lossReason; }

    public BattleAllyRuntime findAlly(Long characterId) {
        return allies.stream().filter(a -> a.getCharacterId().equals(characterId)).findFirst().orElse(null);
    }

    public int sumTeamHp() {
        return allies.stream().mapToInt(BattleAllyRuntime::getCurrentHp).sum();
    }

    public boolean allAlliesDead() {
        return allies.stream().allMatch(a -> a.getCurrentHp() <= 0);
    }
}
