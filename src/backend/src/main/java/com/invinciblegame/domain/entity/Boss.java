package com.invinciblegame.domain.entity;

import com.invinciblegame.domain.enums.Difficulty;
import jakarta.persistence.*;

@Entity
@Table(name = "bosses")
public class Boss {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private String name;
    private Integer maxHp;
    private Integer attack;
    private Integer defense;
    private Integer speed;
    @Column(length = 500)
    private String description;
    @Enumerated(EnumType.STRING)
    private Difficulty difficulty;
    private Double hardcoreMultiplier = 1.5;
    @Column(name = "image_url", length = 512)
    private String imageUrl;

    public Long getId() { return id; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public Integer getMaxHp() { return maxHp; }
    public void setMaxHp(Integer maxHp) { this.maxHp = maxHp; }
    public Integer getAttack() { return attack; }
    public void setAttack(Integer attack) { this.attack = attack; }
    public Integer getDefense() { return defense; }
    public void setDefense(Integer defense) { this.defense = defense; }
    public Integer getSpeed() { return speed; }
    public void setSpeed(Integer speed) { this.speed = speed; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public Difficulty getDifficulty() { return difficulty; }
    public void setDifficulty(Difficulty difficulty) { this.difficulty = difficulty; }
    public Double getHardcoreMultiplier() { return hardcoreMultiplier; }
    public void setHardcoreMultiplier(Double hardcoreMultiplier) { this.hardcoreMultiplier = hardcoreMultiplier; }
    public String getImageUrl() { return imageUrl; }
    public void setImageUrl(String imageUrl) { this.imageUrl = imageUrl; }
}
