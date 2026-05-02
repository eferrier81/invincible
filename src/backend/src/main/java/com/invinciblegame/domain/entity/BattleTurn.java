package com.invinciblegame.domain.entity;

import com.invinciblegame.domain.enums.ActionType;
import jakarta.persistence.*;

@Entity
@Table(name = "battle_turns")
public class BattleTurn {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false)
    private Battle battle;

    private Integer turnNumber;
    private Long actorId;

    @Enumerated(EnumType.STRING)
    private ActionType actionType;

    private Long targetId;
    private Integer damageDealt;

    @Column(length = 500)
    private String actionDescription;

    public Long getId() { return id; }
    public Battle getBattle() { return battle; }
    public void setBattle(Battle battle) { this.battle = battle; }
    public Integer getTurnNumber() { return turnNumber; }
    public void setTurnNumber(Integer turnNumber) { this.turnNumber = turnNumber; }
    public Long getActorId() { return actorId; }
    public void setActorId(Long actorId) { this.actorId = actorId; }
    public ActionType getActionType() { return actionType; }
    public void setActionType(ActionType actionType) { this.actionType = actionType; }
    public Long getTargetId() { return targetId; }
    public void setTargetId(Long targetId) { this.targetId = targetId; }
    public Integer getDamageDealt() { return damageDealt; }
    public void setDamageDealt(Integer damageDealt) { this.damageDealt = damageDealt; }
    public String getActionDescription() { return actionDescription; }
    public void setActionDescription(String actionDescription) { this.actionDescription = actionDescription; }
}
