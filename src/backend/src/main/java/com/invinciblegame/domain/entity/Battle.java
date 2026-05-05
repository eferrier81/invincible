package com.invinciblegame.domain.entity;

import com.invinciblegame.domain.enums.BattleResult;
import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "battles")
public class Battle {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false)
    private User user;

    @ManyToOne(optional = false)
    private Boss boss;

    @ManyToOne(optional = false)
    private Deck deck;

    @Enumerated(EnumType.STRING)
    private BattleResult result = BattleResult.IN_PROGRESS;

    private Boolean isHardcore = false;
    private Integer turnsTaken = 0;
    private Boolean rewardClaimed = false;
    private Integer bossCurrentHp;
    private Integer teamCurrentHp;
    /** JSON array of reward character ids for battle pack. */
    @Column(columnDefinition = "TEXT")
    private String rewardOptionsJson;
    /** JSON snapshot for 3v1 turn state (allies HP, initiative, expected actor, cooldowns). */
    @Column(columnDefinition = "TEXT")
    private String battleStateJson;
    private LocalDateTime createdAt = LocalDateTime.now();
    private LocalDateTime endedAt;

    public Long getId() { return id; }
    public User getUser() { return user; }
    public void setUser(User user) { this.user = user; }
    public Boss getBoss() { return boss; }
    public void setBoss(Boss boss) { this.boss = boss; }
    public Deck getDeck() { return deck; }
    public void setDeck(Deck deck) { this.deck = deck; }
    public BattleResult getResult() { return result; }
    public void setResult(BattleResult result) { this.result = result; }
    public Boolean getHardcore() { return isHardcore; }
    public void setHardcore(Boolean hardcore) { isHardcore = hardcore; }
    public Integer getTurnsTaken() { return turnsTaken; }
    public void setTurnsTaken(Integer turnsTaken) { this.turnsTaken = turnsTaken; }
    public Boolean getRewardClaimed() { return rewardClaimed; }
    public void setRewardClaimed(Boolean rewardClaimed) { this.rewardClaimed = rewardClaimed; }
    public Integer getBossCurrentHp() { return bossCurrentHp; }
    public void setBossCurrentHp(Integer bossCurrentHp) { this.bossCurrentHp = bossCurrentHp; }
    public Integer getTeamCurrentHp() { return teamCurrentHp; }
    public void setTeamCurrentHp(Integer teamCurrentHp) { this.teamCurrentHp = teamCurrentHp; }
    public String getRewardOptionsJson() { return rewardOptionsJson; }
    public void setRewardOptionsJson(String rewardOptionsJson) { this.rewardOptionsJson = rewardOptionsJson; }
    public String getBattleStateJson() { return battleStateJson; }
    public void setBattleStateJson(String battleStateJson) { this.battleStateJson = battleStateJson; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public LocalDateTime getEndedAt() { return endedAt; }
    public void setEndedAt(LocalDateTime endedAt) { this.endedAt = endedAt; }
}
