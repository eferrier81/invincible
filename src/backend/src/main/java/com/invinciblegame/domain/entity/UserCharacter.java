package com.invinciblegame.domain.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "user_characters")
public class UserCharacter {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false)
    private User user;

    @ManyToOne(optional = false)
    private CharacterCard character;

    private Integer level = 1;
    private Integer duplicateCount = 0;
    private Integer abilityUpgradeIndex = 0;
    private LocalDateTime unlockedAt = LocalDateTime.now();

    public Long getId() { return id; }
    public User getUser() { return user; }
    public void setUser(User user) { this.user = user; }
    public CharacterCard getCharacter() { return character; }
    public void setCharacter(CharacterCard character) { this.character = character; }
    public Integer getLevel() { return level; }
    public void setLevel(Integer level) { this.level = level; }
    public Integer getDuplicateCount() { return duplicateCount; }
    public void setDuplicateCount(Integer duplicateCount) { this.duplicateCount = duplicateCount; }
    public Integer getAbilityUpgradeIndex() { return abilityUpgradeIndex; }
    public void setAbilityUpgradeIndex(Integer abilityUpgradeIndex) { this.abilityUpgradeIndex = abilityUpgradeIndex; }
    public LocalDateTime getUnlockedAt() { return unlockedAt; }
}
