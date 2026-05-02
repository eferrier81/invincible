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
}

export interface BattleModel {
  id: number;
  bossId: number;
  deckId: number;
  result: "WIN" | "LOSE" | "DRAW" | "IN_PROGRESS";
  hardcore: boolean;
  turnsTaken: number;
  bossCurrentHp: number;
  teamCurrentHp: number;
  rewardClaimed: boolean;
  createdAt: string;
  endedAt: string | null;
  log: string[];
}
