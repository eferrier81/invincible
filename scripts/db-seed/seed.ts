/**
 * Seeds `bosses` and `characters` to match JPA entities:
 *   Boss (table bosses), CharacterCard (table characters)
 *
 * Image paths are derived from files under `public/images/bosses` and
 * `public/images/characters` (repo root). Each seeded row references one PNG
 * that must exist; stored value is the web path only (e.g. `/images/bosses/x.png`).
 *
 * Usage (from this directory):
 *   npm install
 *   npm run seed
 *
 * Env: reads ../../.env (DB_HOST, DB_PORT, DB_NAME, DB_USERNAME, DB_PASSWORD).
 * From your PC, `.env` often has DB_HOST=db (Docker service name) — that hostname only
 * resolves inside Compose. The seed remaps `db` → `localhost` unless SEED_USE_DOCKER_DB=1.
 * Override anytime with SEED_DB_HOST=...
 *
 * Default: skip inserts when `name` already exists; always runs UPDATE on `image_url`
 * for all rows defined below so paths stay in sync with `public/images/`.
 * `npm run seed:force` — insert without duplicate check (may duplicate names).
 */

import * as dotenv from "dotenv";
import fs from "node:fs";
import mysql from "mysql2/promise";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "../../.env") });

const FORCE = process.argv.includes("--force");

const REPO_ROOT = path.resolve(__dirname, "../..");

/** MySQL host for this script (see file header for `db` vs localhost). */
function seedMysqlHost(): string {
  if (process.env.SEED_DB_HOST) {
    return process.env.SEED_DB_HOST;
  }
  const h = process.env.DB_HOST ?? "localhost";
  if (h === "db" && process.env.SEED_USE_DOCKER_DB !== "1") {
    return "localhost";
  }
  return h;
}

type BossRow = {
  name: string;
  maxHp: number;
  attack: number;
  defense: number;
  speed: number;
  description: string;
  difficulty: "EASY" | "MEDIUM" | "HARD" | "LEGENDARY";
  hardcoreMultiplier: number;
  /** PNG filename only (must exist under public/images/bosses/) */
  imageFile: string;
};

type CharacterRow = {
  name: string;
  rarity: "COMMON" | "RARE" | "EPIC" | "LEGENDARY";
  faction: string;
  maxHp: number;
  attack: number;
  defense: number;
  speed: number;
  passiveKey: string | null;
  passiveValue: string | null;
  isPlayable: boolean;
  /** PNG filename only (must exist under public/images/characters/) */
  imageFile: string;
};

/**
 * Web path `/images/{subdir}/{fileName}`; verifies `public/images/...` exists on disk.
 */
function publicImageWebPath(subdir: "bosses" | "characters", fileName: string): string {
  const abs = path.join(REPO_ROOT, "public", "images", subdir, fileName);
  if (!fs.existsSync(abs)) {
    throw new Error(`Missing PNG for seed: public/images/${subdir}/${fileName} (expected at ${abs})`);
  }
  return `/images/${subdir}/${fileName}`;
}

function assertAllReferencedImagesExist(rows: { imageFile: string }[], subdir: "bosses" | "characters"): void {
  for (const row of rows) {
    publicImageWebPath(subdir, row.imageFile);
  }
}

const BOSSES: BossRow[] = [
  {
    name: "Sinclair's ReAnimen Swarm",
    maxHp: 420,
    attack: 14,
    defense: 6,
    speed: 8,
    description:
      "A wave of cybernetic foot soldiers from the Sinclair project — fast but brittle as a group.",
    difficulty: "EASY",
    hardcoreMultiplier: 1.35,
    imageFile: "reanimen-swarm.png",
  },
  {
    name: "Machine Head's Enforcers",
    maxHp: 780,
    attack: 22,
    defense: 12,
    speed: 10,
    description:
      "Hired muscle and tech-backed bruisers guarding a criminal syndicate's downtown stronghold.",
    difficulty: "MEDIUM",
    hardcoreMultiplier: 1.5,
    imageFile: "machine-head-enforcers.png",
  },
  {
    name: "Battle Beast",
    maxHp: 1200,
    attack: 38,
    defense: 18,
    speed: 14,
    description:
      "A warrior who lives for worthy prey — relentless strikes and terrifying speed.",
    difficulty: "HARD",
    hardcoreMultiplier: 1.65,
    imageFile: "battle-beast.png",
  },
  {
    name: "Conquest",
    maxHp: 2200,
    attack: 48,
    defense: 28,
    speed: 16,
    description:
      "A Viltrumite envoy sent to break Earth's resistance — endurance and raw power.",
    difficulty: "LEGENDARY",
    hardcoreMultiplier: 1.85,
    imageFile: "conquest.png",
  },
  {
    name: "Sequid Hive Titan",
    maxHp: 950,
    attack: 28,
    defense: 14,
    speed: 9,
    description:
      "A massive host body puppeteered by Sequids — high burst damage, uneven defense.",
    difficulty: "MEDIUM",
    hardcoreMultiplier: 1.5,
    imageFile: "sequid-hive-titan.png",
  },
];

/** One row per PNG in `public/images/characters/` (no Monster Girl asset in repo). */
const CHARACTERS: CharacterRow[] = [
  {
    name: "Invincible",
    rarity: "EPIC",
    faction: "Grayson / GDA",
    maxHp: 320,
    attack: 26,
    defense: 14,
    speed: 18,
    passiveKey: "resolve",
    passiveValue: "+5% team damage when below 40% HP (flavor — not enforced by engine)",
    isPlayable: true,
    imageFile: "invincible.png",
  },
  {
    name: "Atom Eve",
    rarity: "RARE",
    faction: "GDA",
    maxHp: 210,
    attack: 22,
    defense: 10,
    speed: 15,
    passiveKey: "barrier",
    passiveValue: "Flavor: shields weakest ally",
    isPlayable: true,
    imageFile: "atom eve.png",
  },
  {
    name: "Robot (Rudy)",
    rarity: "RARE",
    faction: "Guardians",
    maxHp: 260,
    attack: 20,
    defense: 18,
    speed: 11,
    passiveKey: "tactics",
    passiveValue: "Flavor: +initiative planning",
    isPlayable: true,
    imageFile: "robot-rudy.png",
  },
  {
    name: "The Immortal",
    rarity: "COMMON",
    faction: "Guardians",
    maxHp: 380,
    attack: 18,
    defense: 20,
    speed: 10,
    passiveKey: "stubborn",
    passiveValue: "Flavor: extra survivability",
    isPlayable: true,
    imageFile: "the-immortal.png",
  },
  {
    name: "Rex Splode",
    rarity: "RARE",
    faction: "Guardians",
    maxHp: 240,
    attack: 28,
    defense: 9,
    speed: 13,
    passiveKey: "burst",
    passiveValue: "Flavor: crit spikes",
    isPlayable: true,
    imageFile: "rex-splode.png",
  },
  {
    name: "Allen the Alien",
    rarity: "EPIC",
    faction: "Coalition of Planets",
    maxHp: 340,
    attack: 30,
    defense: 15,
    speed: 17,
    passiveKey: "spaceworthy",
    passiveValue: "Flavor: anti-Viltrum tech",
    isPlayable: true,
    imageFile: "allen-the-alien.png",
  },
  {
    name: "Omni-Man (early)",
    rarity: "LEGENDARY",
    faction: "Viltrum",
    maxHp: 480,
    attack: 40,
    defense: 24,
    speed: 14,
    passiveKey: "viltrumite",
    passiveValue: "Flavor: overwhelming baseline stats",
    isPlayable: true,
    imageFile: "omni-man-early.png",
  },
  {
    name: "Shrinking Rae",
    rarity: "COMMON",
    faction: "GDA",
    maxHp: 190,
    attack: 17,
    defense: 11,
    speed: 20,
    passiveKey: "evasive",
    passiveValue: "Flavor: high speed",
    isPlayable: true,
    imageFile: "shrinking-rae.png",
  },
  {
    name: "Dupli-Kate",
    rarity: "RARE",
    faction: "GDA",
    maxHp: 200,
    attack: 16,
    defense: 12,
    speed: 16,
    passiveKey: "duplicates",
    passiveValue: "Flavor: chip damage",
    isPlayable: true,
    imageFile: "dupli-kate.png",
  },
];

async function bossExists(conn: mysql.Connection, name: string): Promise<boolean> {
  const [rows] = await conn.query<mysql.RowDataPacket[]>(
    "SELECT 1 FROM bosses WHERE name = ? LIMIT 1",
    [name]
  );
  return rows.length > 0;
}

async function characterExists(conn: mysql.Connection, name: string): Promise<boolean> {
  const [rows] = await conn.query<mysql.RowDataPacket[]>(
    "SELECT 1 FROM characters WHERE name = ? LIMIT 1",
    [name]
  );
  return rows.length > 0;
}

async function insertBoss(conn: mysql.Connection, b: BossRow, imageUrl: string): Promise<void> {
  await conn.execute(
    `INSERT INTO bosses (name, max_hp, attack, defense, speed, description, difficulty, hardcore_multiplier, image_url)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      b.name,
      b.maxHp,
      b.attack,
      b.defense,
      b.speed,
      b.description,
      b.difficulty,
      b.hardcoreMultiplier,
      imageUrl,
    ]
  );
}

async function detectPlayableColumn(conn: mysql.Connection): Promise<"is_playable" | "playable"> {
  const [cols] = await conn.query<mysql.RowDataPacket[]>(
    `SELECT COLUMN_NAME AS c FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'characters'
       AND COLUMN_NAME IN ('is_playable', 'playable')`
  );
  const names = new Set(cols.map((r) => String(r.c)));
  if (names.has("is_playable")) return "is_playable";
  if (names.has("playable")) return "playable";
  throw new Error(
    "Could not find column is_playable or playable on table `characters`. Start the backend once (ddl-auto: update) so tables exist."
  );
}

async function main(): Promise<void> {
  assertAllReferencedImagesExist(BOSSES, "bosses");
  assertAllReferencedImagesExist(CHARACTERS, "characters");

  const host = seedMysqlHost();
  const port = Number(process.env.DB_PORT ?? "3306");
  const database = process.env.DB_NAME ?? "invincible_game";
  const user = process.env.DB_USERNAME ?? "root";
  const password = process.env.DB_PASSWORD ?? "root";

  if ((process.env.DB_HOST ?? "") === "db" && host === "localhost") {
    console.log("DB_HOST=db → using localhost for seed (set SEED_USE_DOCKER_DB=1 if you run this inside Docker).");
  }

  const conn = await mysql.createConnection({
  host,
  port,
  database,
  user,
  password,
  ssl: {
    rejectUnauthorized: false
  }
});
  try {
    const playableCol = await detectPlayableColumn(conn);

    const insertCharacterDynamic = async (c: CharacterRow, imageUrl: string): Promise<void> => {
      const sql =
        playableCol === "is_playable"
          ? `INSERT INTO characters (name, rarity, faction, max_hp, attack, defense, speed, passive_key, passive_value, is_playable, image_url)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
          : `INSERT INTO characters (name, rarity, faction, max_hp, attack, defense, speed, passive_key, passive_value, playable, image_url)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
      await conn.execute(sql, [
        c.name,
        c.rarity,
        c.faction,
        c.maxHp,
        c.attack,
        c.defense,
        c.speed,
        c.passiveKey,
        c.passiveValue,
        c.isPlayable ? 1 : 0,
        imageUrl,
      ]);
    };

    let bossesInserted = 0;
    let charsInserted = 0;
    let bossesSkipped = 0;
    let charsSkipped = 0;
    let bossImagesUpdated = 0;
    let charImagesUpdated = 0;

    await conn.beginTransaction();
    try {
      for (const b of BOSSES) {
        const imageUrl = publicImageWebPath("bosses", b.imageFile);
        const exists = FORCE ? false : await bossExists(conn, b.name);
        if (exists) {
          bossesSkipped++;
        } else {
          await insertBoss(conn, b, imageUrl);
          bossesInserted++;
        }
        const [res] = await conn.execute<mysql.ResultSetHeader>(
          "UPDATE bosses SET image_url = ? WHERE name = ?",
          [imageUrl, b.name]
        );
        bossImagesUpdated += res.affectedRows;
      }

      for (const c of CHARACTERS) {
        const imageUrl = publicImageWebPath("characters", c.imageFile);
        const exists = FORCE ? false : await characterExists(conn, c.name);
        if (exists) {
          charsSkipped++;
        } else {
          await insertCharacterDynamic(c, imageUrl);
          charsInserted++;
        }
        const [res] = await conn.execute<mysql.ResultSetHeader>(
          "UPDATE characters SET image_url = ? WHERE name = ?",
          [imageUrl, c.name]
        );
        charImagesUpdated += res.affectedRows;
      }

      await conn.commit();
    } catch (e) {
      await conn.rollback();
      throw e;
    }

    console.log(
      `Seed done. Bosses: +${bossesInserted} (skipped ${bossesSkipped}), image_url rows touched: ${bossImagesUpdated}. ` +
        `Characters: +${charsInserted} (skipped ${charsSkipped}), image_url rows touched: ${charImagesUpdated}.`
    );
    if (FORCE) {
      console.log("Note: --force was set; duplicate names were not checked.");
    }
  } finally {
    await conn.end();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
