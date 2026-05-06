package com.invinciblegame.domain.battle;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

@JsonIgnoreProperties(ignoreUnknown = true)
public class BattleAllyRuntime {
    private Long characterId;
    private String name;
    private int currentHp;
    private int maxHp;
    private int attack;
    private int defense;
    private int speed;
    private int skillCooldownRemaining;
    /** Desperation (phase-3 ability) can only be used once per hero per battle. */
    private boolean desperationUsed;
    private int level = 1;

    public BattleAllyRuntime() {}

    public BattleAllyRuntime(
        Long characterId,
        String name,
        int currentHp,
        int maxHp,
        int attack,
        int defense,
        int speed,
        int skillCooldownRemaining
    ) {
        this(characterId, name, currentHp, maxHp, attack, defense, speed, skillCooldownRemaining, false, 1);
    }

    public BattleAllyRuntime(
        Long characterId,
        String name,
        int currentHp,
        int maxHp,
        int attack,
        int defense,
        int speed,
        int skillCooldownRemaining,
        boolean desperationUsed,
        int level
    ) {
        this.characterId = characterId;
        this.name = name;
        this.currentHp = currentHp;
        this.maxHp = maxHp;
        this.attack = attack;
        this.defense = defense;
        this.speed = speed;
        this.skillCooldownRemaining = skillCooldownRemaining;
        this.desperationUsed = desperationUsed;
        this.level = level;
    }

    public Long getCharacterId() { return characterId; }
    public void setCharacterId(Long characterId) { this.characterId = characterId; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public int getCurrentHp() { return currentHp; }
    public void setCurrentHp(int currentHp) { this.currentHp = currentHp; }
    public int getMaxHp() { return maxHp; }
    public void setMaxHp(int maxHp) { this.maxHp = maxHp; }
    public int getAttack() { return attack; }
    public void setAttack(int attack) { this.attack = attack; }
    public int getDefense() { return defense; }
    public void setDefense(int defense) { this.defense = defense; }
    public int getSpeed() { return speed; }
    public void setSpeed(int speed) { this.speed = speed; }
    public int getSkillCooldownRemaining() { return skillCooldownRemaining; }
    public void setSkillCooldownRemaining(int skillCooldownRemaining) { this.skillCooldownRemaining = skillCooldownRemaining; }
    public boolean isDesperationUsed() { return desperationUsed; }
    public void setDesperationUsed(boolean desperationUsed) { this.desperationUsed = desperationUsed; }
    public int getLevel() { return level; }
    public void setLevel(int level) { this.level = level; }
}
