package com.invinciblegame.domain.entity;

import com.invinciblegame.domain.enums.Rarity;
import jakarta.persistence.*;

@Entity
@Table(name = "characters")
public class CharacterCard {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private String name;
    @Enumerated(EnumType.STRING)
    private Rarity rarity;
    private String faction;
    private Integer maxHp;
    private Integer attack;
    private Integer defense;
    private Integer speed;
    private String passiveKey;
    private String passiveValue;
    private Boolean isPlayable = true;
    @Column(name = "image_url", length = 512)
    private String imageUrl;

    public Long getId() { return id; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public Rarity getRarity() { return rarity; }
    public void setRarity(Rarity rarity) { this.rarity = rarity; }
    public String getFaction() { return faction; }
    public void setFaction(String faction) { this.faction = faction; }
    public Integer getMaxHp() { return maxHp; }
    public void setMaxHp(Integer maxHp) { this.maxHp = maxHp; }
    public Integer getAttack() { return attack; }
    public void setAttack(Integer attack) { this.attack = attack; }
    public Integer getDefense() { return defense; }
    public void setDefense(Integer defense) { this.defense = defense; }
    public Integer getSpeed() { return speed; }
    public void setSpeed(Integer speed) { this.speed = speed; }
    public String getPassiveKey() { return passiveKey; }
    public void setPassiveKey(String passiveKey) { this.passiveKey = passiveKey; }
    public String getPassiveValue() { return passiveValue; }
    public void setPassiveValue(String passiveValue) { this.passiveValue = passiveValue; }
    public Boolean getPlayable() { return isPlayable; }
    public void setPlayable(Boolean playable) { isPlayable = playable; }
    public String getImageUrl() { return imageUrl; }
    public void setImageUrl(String imageUrl) { this.imageUrl = imageUrl; }
}
