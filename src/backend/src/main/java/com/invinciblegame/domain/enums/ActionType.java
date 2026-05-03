package com.invinciblegame.domain.enums;

public enum ActionType {
    ATTACK,
    SKILL,
    /** Ally-only: unlocked from boss phase 2. Moderate bonus damage. */
    FOCUS,
    /** Ally-only: unlocked from boss phase 3. Once per hero per battle. */
    DESPERATION,
    /** Log-only marker for boss phase transitions. */
    PHASE_EVENT
}
