import { BattleAllyModel, BattleModel, BossModel, CardModel } from "./models";

/** First non-empty string among candidates (camelCase + snake_case from API). */
export function pickStr(...vals: unknown[]): string | null {
  for (const v of vals) {
    if (v == null) continue;
    const s = String(v).trim();
    if (s.length > 0) {
      return s;
    }
  }
  return null;
}

function num(v: unknown, fallback = 0): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

function numOrNull(v: unknown): number | null {
  if (v == null || v === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function strList(r: Record<string, unknown>, camel: string, snake: string): string[] {
  const raw = r[camel] ?? r[snake];
  if (!Array.isArray(raw)) return [];
  return raw.map((x) => String(x));
}

export function normalizeBoss(r: Record<string, unknown>): BossModel {
  return {
    id: num(r["id"]),
    name: String(r["name"] ?? ""),
    difficulty: String(r["difficulty"] ?? ""),
    maxHp: num(r["maxHp"] ?? r["max_hp"]),
    attack: num(r["attack"]),
    defense: num(r["defense"]),
    speed: num(r["speed"]),
    hardcoreMultiplier: num(r["hardcoreMultiplier"] ?? r["hardcore_multiplier"], 1),
    description: String(r["description"] ?? ""),
    imageUrl: pickStr(r["imageUrl"], r["image_url"]),
  };
}

export function normalizeCard(r: Record<string, unknown>): CardModel {
  return {
    id: num(r["id"]),
    name: String(r["name"] ?? ""),
    rarity: String(r["rarity"] ?? ""),
    faction: String(r["faction"] ?? ""),
    maxHp: num(r["maxHp"] ?? r["max_hp"]),
    attack: num(r["attack"]),
    defense: num(r["defense"]),
    speed: num(r["speed"]),
    owned: Boolean(r["owned"]),
    imageUrl: pickStr(r["imageUrl"], r["image_url"]),
  };
}

export function normalizeBattleAlly(a: Record<string, unknown>): BattleAllyModel {
  return {
    characterId: num(a["characterId"] ?? a["character_id"]),
    name: String(a["name"] ?? ""),
    currentHp: num(a["currentHp"] ?? a["current_hp"]),
    maxHp: num(a["maxHp"] ?? a["max_hp"]),
    attack: num(a["attack"]),
    defense: num(a["defense"]),
    speed: num(a["speed"]),
    skillCooldownRemaining: num(a["skillCooldownRemaining"] ?? a["skill_cooldown_remaining"]),
    desperationUsed: Boolean(a["desperationUsed"] ?? a["desperation_used"]),
    imageUrl: pickStr(a["imageUrl"], a["image_url"]),
  };
}

export function normalizeBattle(r: Record<string, unknown>): BattleModel {
  const alliesRaw = r["allies"];
  const allies: BattleAllyModel[] = Array.isArray(alliesRaw)
    ? alliesRaw.map((x) => normalizeBattleAlly(x as Record<string, unknown>))
    : [];

  return {
    id: num(r["id"]),
    bossId: num(r["bossId"] ?? r["boss_id"]),
    deckId: num(r["deckId"] ?? r["deck_id"]),
    result: r["result"] as BattleModel["result"],
    hardcore: Boolean(r["hardcore"]),
    turnsTaken: num(r["turnsTaken"] ?? r["turns_taken"]),
    bossCurrentHp: num(r["bossCurrentHp"] ?? r["boss_current_hp"]),
    bossMaxHp: num(r["bossMaxHp"] ?? r["boss_max_hp"]),
    bossImageUrl: pickStr(r["bossImageUrl"], r["boss_image_url"]),
    teamCurrentHp: num(r["teamCurrentHp"] ?? r["team_current_hp"]),
    expectedCharacterId: numOrNull(r["expectedCharacterId"] ?? r["expected_character_id"]),
    roundNumber: num(r["roundNumber"] ?? r["round_number"]),
    allies,
    bossPhase: num(r["bossPhase"] ?? r["boss_phase"], 1),
    teamUnlockedAbilities: strList(r, "teamUnlockedAbilities", "team_unlocked_abilities"),
    bossUnlockedAbilities: strList(r, "bossUnlockedAbilities", "boss_unlocked_abilities"),
    maxRounds: num(r["maxRounds"] ?? r["max_rounds"], 50),
    lossReason: pickStr(r["lossReason"], r["loss_reason"]),
    skillCooldownAfterUse: num(r["skillCooldownAfterUse"] ?? r["skill_cooldown_after_use"], 2),
    rewardClaimed: Boolean(r["rewardClaimed"] ?? r["reward_claimed"]),
    createdAt: String(r["createdAt"] ?? r["created_at"] ?? ""),
    endedAt: (r["endedAt"] ?? r["ended_at"]) as string | null,
    log: Array.isArray(r["log"]) ? r["log"].map(String) : [],
  };
}
