export type Role = "PLAYER" | "ADMIN";

export interface AuthResponse {
  token: string;
  username: string;
  role: Role;
}

export interface UserProfile {
  id: number;
  username: string;
  email: string;
  role: Role;
  energy: number;
  maxEnergy: number;
  nextEnergyAt: string | null;
  secondsUntilNextEnergy: number | null;
  hardcoreUnlocked: boolean;
  clearedBosses: number;
  totalBosses: number;
}

export interface CardModel {
  id: number;
  name: string;
  rarity: string;
  faction: string;
  maxHp: number;
  attack: number;
  defense: number;
  speed: number;
  owned: boolean;
  duplicateCount?: number | null;
  abilityUpgradeIndex?: number | null;
  level?: number | null;
  passiveKey?: string | null;
  passiveValue?: string | null;
  /** Relative path e.g. `/images/characters/invincible.png` */
  imageUrl?: string | null;
}

export interface DeckModel {
  id: number;
  name: string;
  description: string;
  slotNumber: number;
  characterIds: number[];
}

export interface BossModel {
  id: number;
  name: string;
  difficulty: string;
  maxHp: number;
  attack: number;
  defense: number;
  speed: number;
  hardcoreMultiplier: number;
  description: string;
  /** Relative path e.g. `/images/bosses/conquest.png` */
  imageUrl?: string | null;
}

export interface BattleAllyModel {
  characterId: number;
  name: string;
  currentHp: number;
  maxHp: number;
  attack: number;
  defense: number;
  speed: number;
  skillCooldownRemaining: number;
  /** True after this hero used Desperation in this battle (phase 3 ability, once per hero). */
  desperationUsed: boolean;
  level: number;
  passiveKey?: string | null;
  passiveValue?: string | null;
  imageUrl?: string | null;
}

export interface BattleModel {
  id: number;
  bossId: number;
  deckId: number;
  result: "WIN" | "LOSE" | "DRAW" | "IN_PROGRESS";
  hardcore: boolean;
  turnsTaken: number;
  bossCurrentHp: number;
  bossMaxHp: number;
  bossImageUrl?: string | null;
  teamCurrentHp: number;
  /** Which ally must act (3v1 turn order). Null when battle ended. */
  expectedCharacterId: number | null;
  roundNumber: number;
  allies: BattleAllyModel[];
  /** 1 = upper third HP, 2 = middle, 3 = lower. */
  bossPhase: number;
  /** Team actions unlocked for the current boss phase (e.g. FOCUS, DESPERATION). */
  teamUnlockedAbilities: string[];
  /** Boss passives for the current phase (e.g. CRUSH, FURY). */
  bossUnlockedAbilities: string[];
  /** Full rounds before forced loss (team+boss cycles). */
  maxRounds: number;
  /** BOSS_DEFEATED | ALL_HEROES_DEFEATED | ROUND_LIMIT | null (in progress or legacy). */
  lossReason: string | null;
  /** Reward pack options when a boss win occurs and reward is unclaimed. */
  rewardOptions: CardModel[];
  /** Own-action turns of cooldown on a character after using Skill (Attack has no cooldown and reduces this counter). */
  skillCooldownAfterUse: number;
  rewardClaimed: boolean;
  createdAt: string;
  endedAt: string | null;
  log: string[];
}

export interface PullStatusModel {
  welcomeAvailable: boolean;
  dailyAvailable: boolean;
  nextDailyAt: string | null;
}

export interface PullResultModel {
  type: string;
  cards: CardModel[];
  status: PullStatusModel;
}
