# Invincible Game — Cursor Project Context
> Full-stack turn-based boss battle web app themed on the *Invincible* universe.  
> University term project: **977-364 – Software Deployment and Maintenance** — Prince of Songkla University, Phuket Campus.

---

## 1. Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Angular 17+ (SPA, standalone components, route guards, JWT interceptor) |
| Backend | Java 21 + Spring Boot 3.x (REST API, Spring Security, JWT, Spring Actuator) |
| Database | MySQL 8 (via JPA/Hibernate) |
| Containerization | Docker (multi-stage builds) + Docker Compose |
| CI/CD | GitHub Actions |
| Cloud Deployment | Railway / Render / AWS Free Tier |
| Auth | JWT — roles: `PLAYER`, `ADMIN` |
| Build Tools | Maven (backend), Angular CLI (frontend) |

---

## 2. Repository Structure

```
project-root/
├── src/
│   ├── frontend/          # Angular SPA
│   └── backend/           # Spring Boot application
├── tests/                 # Unit and integration tests
├── docs/
│   ├── architecture.md
│   ├── deployment-guide.md
│   ├── change-requests/
│   └── progress-logs/
├── Dockerfile             # Backend multi-stage
├── Dockerfile.frontend    # Frontend multi-stage (Nginx)
├── docker-compose.yml
├── .github/workflows/     # CI/CD YAML files
├── CHANGELOG.md
└── README.md
```

---

## 3. Core Gameplay Rules

- **Turn-based 3v1**: 3 player characters vs 1 boss per battle.
- **Energy system**: each player starts with 5 energy; 1 energy per battle; regenerates 1/hour.
- **One action per character per turn**: ATTACK (no cooldown) OR SKILL (has cooldown).
- **Boss phases**: each boss has 3 HP phases (HP divided in thirds). At each phase transition, both sides unlock a new ability.
- **Win condition**: boss HP = 0. **Lose**: all 3 player HP = 0, or 50 rounds reached (counts as loss).
- **Deck**: exactly 3 characters; up to 3 saved deck configurations per user.
- **Pulls/packs**:
  - Welcome pull (first login): 3 characters, max Epic rarity.
  - Daily pull: 1 pack/day, no guaranteed rarity.
  - Battle reward: 3-character pack on boss win; player picks 1.
  - Drop rates: Legendary 2%, Epic 8%, Rare 20%, Common 70%.
- **Duplicate logic**: if character already owned, player upgrades one skill's `powerMultiplier` coefficient instead.
- **Character progression**: level up by triggering boss phase transitions → better stats (HP, attack, defense). Milestone levels unlock passive ability/talent.
- **Hardcore mode**: unlocked after clearing all 12 Normal bosses; applies `hardcoreMultiplier` to boss stats.

---

## 4. Character Roster

### Legendary (~2% drop)
| Name | Alias | Faction |
|---|---|---|
| Invincible | Mark Grayson | Héros / Viltrumite |
| Omni-Man | Nolan Grayson | Viltrumite |
| Thragg | Grand Régent | Viltrumite |
| Battle Beast | Guerrier lion | Alien |
| Conquest | Guerrier Viltrumite | Viltrumite |

### Epic (~8% drop)
| Name | Alias | Faction |
|---|---|---|
| Atom Eve | Transmutation | Héros / Guardian |
| Robot | Génie tactique | Guardian |
| L'Immortel | Régénération infinie | Héros / Guardian |
| Allen the Alien | Champion Coalition | Alien / Héros |
| Anissa | Élite Viltrumite | Viltrumite |
| Oliver Grayson | Kid Omni-Man | Viltrumite / Héros |
| Cecil Stedman | Directeur GDA | Humain |
| Angstrom Levy | Multiversel | Villain |

### Rare (~20% drop)
| Name | Alias | Faction |
|---|---|---|
| Rex Splode | Explosif | Héros / Guardian |
| Monster Girl | Transformation ogre | Héros / Guardian |
| Dupli-Kate | Duplication | Héros / Guardian |
| Bulletproof | Invulnérabilité | Héros / Guardian |
| Shrinking Rae | Réduction de taille | Héros / Guardian |
| Titan | Armure de pierre | Villain |
| Kregg | Général Viltrumite | Viltrumite |
| Space Racer | Pistolet invincible | Alien |
| Tech Jacket | Armure techno | Héros |
| D.A. Sinclair | Cyborgs Reanimen | Villain / Humain |

### Common (~70% drop)
| Name | Alias | Faction |
|---|---|---|
| Superpatriot | Soldat augmenté | Héros / Humain |
| Shapesmith | Métamorphe martien | Alien |
| Mauler Twin A | Savant criminel | Villain |
| Mauler Twin B | Clone du savant | Villain |
| Amber Bennett | Support moral | Humain |
| William Clockwell | Hacker amateur | Humain |
| Debbie Grayson | Soutien familial | Humain |
| Reaniman | Cyborg de base | Villain |

> **Note**: Bosses are NOT playable characters.  
> Card art: https://www.deviantart.com/fdr1027/gallery/96344337/invincible-character-renders

---

## 5. Boss Roster (12 bosses, 4 difficulty tiers)

| Boss | Difficulty | Special Mechanic |
|---|---|---|
| Machine Head | Easy | Balanced entry-level |
| Mauler Twins | Easy | Killing one weakens the other |
| D.A. Sinclair | Easy | Summons Reanimen minions |
| Titan | Medium | High defense, moderate speed |
| Angstrom Levy | Medium | Phase ability summons portal allies |
| Robot (villain) | Medium | Drone swarm mechanic |
| Kregg | Hard | Phase unlocks Viltrumite fury |
| Anissa | Hard | Fastest boss, multi-hit turn |
| Conquest | Hard | High damage, enrage mechanic |
| Omni-Man | Hard | Mid-battle power spike |
| Battle Beast | Legendary | Gains power as HP drops |
| Thragg | Legendary | Final boss, all phases hit differently |

---

## 6. MySQL Database Schema

```sql
-- Users
CREATE TABLE users (
  id INT PK AUTO_INCREMENT,
  username VARCHAR(50) UNIQUE NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('PLAYER','ADMIN') DEFAULT 'PLAYER',
  energy INT DEFAULT 5,
  last_energy_update DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Characters (playable cards)
CREATE TABLE characters (
  id INT PK AUTO_INCREMENT,
  name VARCHAR(100),
  rarity ENUM('COMMON','RARE','EPIC','LEGENDARY'),
  faction VARCHAR(100),
  max_hp INT, attack INT, defense INT, speed INT,
  passive_key VARCHAR(50), passive_value VARCHAR(255),
  is_playable BOOLEAN DEFAULT TRUE,
  image_url VARCHAR(255)
);

-- Skills / Abilities
CREATE TABLE skills (
  id INT PK AUTO_INCREMENT,
  character_id INT FK characters,
  name VARCHAR(100),
  type ENUM('DAMAGE','HEAL','SHIELD','STUN','BUFF'),
  power_multiplier FLOAT,
  cooldown INT DEFAULT 0,
  target_type ENUM('SINGLE_ENEMY','ALL_ENEMIES','SELF','ALL_ALLIES'),
  effect_data JSON,
  unlock_phase INT DEFAULT 0
);

-- User collection
CREATE TABLE user_characters (
  id INT PK AUTO_INCREMENT,
  user_id INT FK users,
  character_id INT FK characters,
  level INT DEFAULT 1,
  duplicate_count INT DEFAULT 0,
  ability_upgrade_index INT,
  unlocked_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Decks
CREATE TABLE decks (
  id INT PK AUTO_INCREMENT,
  user_id INT FK users,
  name VARCHAR(100), description VARCHAR(255),
  is_active BOOLEAN DEFAULT FALSE,
  slot_number INT
);

CREATE TABLE deck_characters (
  deck_id INT FK decks,
  character_id INT FK characters,
  position INT,
  PRIMARY KEY(deck_id, character_id)
);

-- Bosses
CREATE TABLE bosses (
  id INT PK AUTO_INCREMENT,
  name VARCHAR(100),
  max_hp INT, attack INT, defense INT, speed INT,
  description TEXT,
  difficulty ENUM('EASY','MEDIUM','HARD','LEGENDARY'),
  hardcore_multiplier FLOAT DEFAULT 1.5,
  image_url VARCHAR(255)
);

CREATE TABLE boss_rewards (
  boss_id INT FK bosses,
  character_id INT FK characters,
  weight INT,
  PRIMARY KEY(boss_id, character_id)
);

-- Battles
CREATE TABLE battles (
  id INT PK AUTO_INCREMENT,
  user_id INT FK users,
  boss_id INT FK bosses,
  deck_id INT FK decks,
  result ENUM('WIN','LOSE','DRAW','IN_PROGRESS'),
  is_hardcore BOOLEAN DEFAULT FALSE,
  turns_taken INT,
  created_at DATETIME, ended_at DATETIME,
  reward_claimed BOOLEAN DEFAULT FALSE
);

CREATE TABLE battle_turns (
  id INT PK AUTO_INCREMENT,
  battle_id INT FK battles,
  turn_number INT,
  actor_type ENUM('PLAYER_CHAR','BOSS'),
  actor_id INT,
  action_type ENUM('ATTACK','SKILL','DEFEND'),
  skill_id INT FK skills NULL,
  target_id INT,
  damage_dealt INT,
  effect_applied VARCHAR(100),
  action_description TEXT
);
```

---

## 7. REST API Endpoints

### Auth
- `POST /api/auth/register` — register (username, email, password BCrypt)
- `POST /api/auth/login` — returns JWT token
- `GET /api/auth/me` — current user profile + energy

### Characters / Cards
- `GET /api/cards` — full Dex; `?owned=true` for user's collection
- `GET /api/cards/{id}` — character detail (stats, skills, passives)

### Decks
- `GET /api/decks` — all saved decks for current user
- `POST /api/decks` — create deck (body: `name`, `characterIds[3]`, `slotNumber 1-3`)
- `PUT /api/decks/{id}` — update deck
- `DELETE /api/decks/{id}` — delete deck
- Server-side validation: exactly 3 characters, all owned by user, max 3 decks

### Bosses
- `GET /api/bosses` — list all bosses with difficulty, HP preview, reward pool preview
- `GET /api/bosses/{id}` — full boss detail (stats, phases, skill unlocks, rewards)

### Battles
- `POST /api/battles/start` — body: `bossId`, `deckId`, `isHardcore`; deducts 1 energy; returns initial battle state
- `POST /api/battles/{id}/action` — body: `actorId`, `actionType (ATTACK|SKILL)`, `skillId?`, `targetId`; returns updated state + log
- `GET /api/battles/{id}` — full current battle state
- `POST /api/battles/{id}/claim-reward` — body: `characterId`; awards chosen character
- `GET /api/battles/history` — paginated battle history

### Admin (ADMIN role only)
- `/api/admin/**` — CRUD for characters, skills, bosses, reward pools, user management

---

## 8. Combat Formulas

```
Initiative order: descending speed; boss acts last each round

Damage:  max(1, attacker.attack * skill.powerMultiplier - defender.defense * 0.5)
Heal:    character.maxHp * skill.powerMultiplier

Phase transitions: at 66% and 33% boss HP → both sides unlock next phase skill
Max rounds: 50 → counts as loss
```

---

## 9. Angular Frontend Modules

| Module | Route | Description |
|---|---|---|
| `AuthModule` | `/login`, `/register` | JWT in localStorage; AuthGuard on all other routes |
| `DashboardModule` | `/dashboard` | Collection count, active decks, bosses, energy bar |
| `CollectionModule` | `/collection` | Owned cards grid, filter by rarity/faction, card detail modal |
| `DexModule` | `/dex` | All characters (locked/unlocked), rarity/faction filter |
| `DeckBuilderModule` | `/deck-builder` | Pick 3 from owned, validate, save/edit/delete up to 3 decks |
| `BossesModule` | `/bosses` | Boss list with difficulty badge, HP preview, reward pool preview |
| `BattleModule` | `/battle/:bossId` | Boss HP bar (3 phases), team HP bars, skill buttons + cooldowns, battle log, victory/reward modal |
| `AdminModule` | `/admin` | CRUD forms for characters, skills, bosses; user management; ADMIN only |

**Key Angular requirements:**
- `AuthGuard` (logged in) + `AdminGuard` (ADMIN role)
- HTTP interceptor: attaches `Authorization: Bearer <token>` to every request
- Reactive forms with validators
- Responsive layout: mobile + desktop

---

## 10. Spring Boot Backend Structure

```
src/main/java/
└── com/invinciblegame/
    ├── controllers/
    │   ├── AuthController.java
    │   ├── CardController.java
    │   ├── DeckController.java
    │   ├── BossController.java
    │   ├── BattleController.java
    │   └── AdminController.java
    ├── services/
    │   ├── UserService.java
    │   ├── CardService.java
    │   ├── DeckService.java
    │   ├── BossService.java
    │   ├── BattleService.java       ← combat engine
    │   └── RewardService.java
    ├── repositories/               ← JPA repos for all entities
    ├── entities/                   ← JPA entities
    ├── dto/                        ← Request/Response DTOs
    ├── security/
    │   ├── JwtFilter.java
    │   ├── JwtUtils.java
    │   └── SecurityConfig.java
    └── scheduler/
        └── EnergyRegenerationTask.java   ← @Scheduled, 1 energy/hour
```

---

## 11. Docker Configuration

### Backend `Dockerfile`
```dockerfile
FROM maven:3.9-eclipse-temurin-21 AS build
WORKDIR /app
COPY pom.xml .
RUN mvn dependency:go-offline
COPY src ./src
RUN mvn clean package -DskipTests

FROM eclipse-temurin:21-jre-alpine
WORKDIR /app
COPY --from=build /app/target/*.jar app.jar
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]
```

### Frontend `Dockerfile.frontend`
```dockerfile
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build -- --configuration production

FROM nginx:alpine
COPY --from=build /app/dist/invincible-game /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
```

### `docker-compose.yml`
```yaml
version: '3.9'
services:
  db:
    image: mysql:8
    environment:
      MYSQL_DATABASE: ${DB_NAME}
      MYSQL_USER: ${DB_USERNAME}
      MYSQL_PASSWORD: ${DB_PASSWORD}
      MYSQL_ROOT_PASSWORD: ${DB_ROOT_PASSWORD}
    ports: ["3306:3306"]
    volumes: [mysql_data:/var/lib/mysql]
    healthcheck:
      test: ["CMD", "mysqladmin", "ping", "-h", "localhost"]
      interval: 10s
      retries: 5

  backend:
    build: .
    depends_on:
      db: { condition: service_healthy }
    environment:
      DB_HOST: db
      DB_PORT: 3306
      DB_NAME: ${DB_NAME}
      DB_USERNAME: ${DB_USERNAME}
      DB_PASSWORD: ${DB_PASSWORD}
      JWT_SECRET: ${JWT_SECRET}
      JWT_EXPIRATION_MS: ${JWT_EXPIRATION_MS}
      CORS_ALLOWED_ORIGINS: ${CORS_ALLOWED_ORIGINS}
      SPRING_PROFILES_ACTIVE: ${SPRING_PROFILES_ACTIVE}
    ports: ["8080:8080"]
    restart: unless-stopped

  frontend:
    build:
      context: ./src/frontend
      dockerfile: Dockerfile.frontend
    depends_on: [backend]
    ports: ["80:80"]
    restart: unless-stopped

volumes:
  mysql_data:
```

### `.env` template
```env
DB_HOST=db
DB_PORT=3306
DB_NAME=invincible_game
DB_USERNAME=invincible_user
DB_PASSWORD=<secret>
DB_ROOT_PASSWORD=<secret>
JWT_SECRET=<min-256-bit-secret>
JWT_EXPIRATION_MS=86400000
CORS_ALLOWED_ORIGINS=http://localhost:4200
SPRING_PROFILES_ACTIVE=dev
```

---

## 12. CI/CD — GitHub Actions

### `ci.yml` (on PR to `develop`)
```yaml
name: CI Pipeline
on:
  pull_request:
    branches: [develop]
jobs:
  lint-frontend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '20' }
      - run: cd src/frontend && npm ci && npm run lint
  test-backend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-java@v4
        with: { java-version: '21', distribution: 'temurin' }
      - run: mvn test
  build-docker:
    needs: [lint-frontend, test-backend]
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: docker/build-push-action@v5
        with: { context: ., push: false }
```

### `deploy.yml` (on push to `main`)
```yaml
name: CD Pipeline
on:
  push:
    branches: [main]
jobs:
  build-and-push:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: docker/login-action@v3
        with:
          registry: ghcr.io
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}
      - uses: docker/build-push-action@v5
        with:
          push: true
          tags: ghcr.io/${{ github.repository }}/backend:${{ github.sha }}
  deploy:
    needs: build-and-push
    runs-on: ubuntu-latest
    steps:
      - name: Deploy to Railway/Render
        run: echo "Add your cloud deploy step here"
```

---

## 13. Git Branching Strategy

```
main        ← stable, production-ready, tagged releases (v1.0.0, v1.1.0)
develop     ← integration branch, all features merge here first
feature/*   ← individual feature branches (e.g., feature/battle-engine)
fix/*       ← bug fix branches (e.g., fix/energy-regeneration)
release/*   ← release preparation (e.g., release/v1.1.0)
```

- All changes via Pull Requests with at least 1 peer review
- Conventional Commits: `feat:`, `fix:`, `docs:`, `chore:`, `test:`, `refactor:`
- Squash and merge for feature branches

---

## 14. Semantic Versioning

- **v1.0.0** — Initial release: all P0 + P1 features, fully deployed
- **v1.1.0** — Maintenance release: ≥3 bug fixes + ≥1 new feature + ≥1 security/perf improvement

---

## 15. Implementation Priority

| Priority | Feature |
|---|---|
| **P0 (Must)** | Auth (JWT), Character Dex, Boss list/detail, Turn-based battle engine, Battle reward flow, Deck builder, Energy system, Admin panel |
| **P1 (Should)** | Character progression (level-up, stat growth), Phase transitions (skill unlocks), Duplicate handling, Daily pull, Welcome pull, Battle history, Hardcore mode |
| **P2 (Optional)** | 3 saved deck configs, Leaderboard, Animated battle sequences |

---

## 16. Security Requirements

- Passwords hashed with BCrypt (`PasswordEncoder` bean)
- JWT secret loaded from env var — **never hardcoded**
- Input validation: Bean Validation (`@Valid`, `@NotBlank`, etc.) on all endpoints
- Custom `DeckValidator` for server-side deck constraints
- CORS configured via `CORS_ALLOWED_ORIGINS` env var
- Spring Security: stateless session, JWT filter before `UsernamePasswordAuthenticationFilter`
- Admin routes: `@PreAuthorize("hasRole('ADMIN')")`

---

## 17. Monitoring & Resilience

- `spring-boot-starter-actuator`: expose `/actuator/health` and `/actuator/metrics`
- Container health checks in `docker-compose.yml` for db and backend
- `restart: unless-stopped` on all services
- Structured logging on `/api/battles/**`
- `@Scheduled` task for energy regeneration (1/hour)

---

*End of Cursor context — Invincible Game / 977-364 Term Project*
