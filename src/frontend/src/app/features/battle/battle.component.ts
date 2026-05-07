import { Component, OnInit } from "@angular/core";
import { FormBuilder, ReactiveFormsModule } from "@angular/forms";
import { NgClass, NgFor, NgIf } from "@angular/common";
import { ActivatedRoute } from "@angular/router";
import { BattleAllyModel, BattleModel, BossModel, CardModel, DeckModel, UserProfile } from "../../core/models";
import { GameApiService } from "../../core/services/game-api.service";
import { AuthService } from "../../core/services/auth.service";
import { imageSrc } from "../../core/image-url";
import { environment } from "../../../environments/environment";

@Component({
  standalone: true,
  imports: [ReactiveFormsModule, NgIf, NgFor, NgClass],
  template: `
    <section class="card">
      <h2>Battle (3v1)</h2>
      <p class="hint">
        Three deck characters act in initiative order (speed, high first). The boss acts once after all living allies have acted.
        <strong>Win:</strong> boss HP reaches 0.
        <strong>Lose:</strong> all heroes reach 0 HP, or the round limit (50 full team+boss cycles) is exceeded without a win.
      </p>
      <p *ngIf="profile" class="energy-line">
        Your energy: <strong>{{ profile.energy }}</strong> / {{ profile.maxEnergy }}
        <span class="cost">(each battle costs 1)</span>
      </p>
      <form [formGroup]="startForm" (ngSubmit)="startBattle()" class="start-form">
        <div class="start-form__row">
          <div class="start-form__field">
            <label>Boss</label>
            <select formControlName="bossId">
              <option *ngFor="let b of bosses" [value]="b.id">{{ b.id }} — {{ b.name }}</option>
            </select>
          </div>
          <div class="start-preview" *ngIf="previewBoss() as pb">
            <div class="entity-media">
              <img
                *ngIf="bossPortrait(pb); else noPreviewBoss"
                class="img-entity img-entity--1x1 start-preview__img"
                [src]="bossPortrait(pb)!"
                [alt]="pb.name"
                loading="lazy"
              />
              <ng-template #noPreviewBoss>
                <div class="entity-placeholder start-preview__ph">No image</div>
              </ng-template>
            </div>
            <p class="start-preview__caption">{{ pb.name }}</p>
          </div>
        </div>
        <div>
          <label>Deck (exactly 3 characters)</label>
          <select formControlName="deckId">
            <option *ngFor="let d of decks" [value]="d.id">{{ d.id }} — {{ d.name }}</option>
          </select>
        </div>
        <label>
          <input type="checkbox" formControlName="isHardcore" [disabled]="!profile?.hardcoreUnlocked" /> Hardcore
        </label>
        <p *ngIf="profile && !profile.hardcoreUnlocked" class="hint">
          Unlock hardcore by clearing all normal bosses ({{ profile.clearedBosses }}/{{ profile.totalBosses }}).
        </p>
        <button type="submit" [disabled]="!canStartBattle()">Start battle</button>
      </form>
      <p *ngIf="error" class="form-error-battle">{{ error }}</p>
    </section>

    <section class="card battle-field" *ngIf="battle">
      <h3>Battle #{{ battle.id }} — {{ battle.result }}</h3>
      <p
        *ngIf="battle.result !== 'IN_PROGRESS'"
        class="outcome-banner"
        [ngClass]="{
          'outcome-banner--win': battle.result === 'WIN',
          'outcome-banner--lose': battle.result === 'LOSE',
          'outcome-banner--draw': battle.result === 'DRAW'
        }"
      >
        {{ outcomeTitle() }}<span *ngIf="outcomeSubtitle()"> — {{ outcomeSubtitle() }}</span>
      </p>
      <div *ngIf="showRewardPack()" class="reward-pack">
        <h4>Battle reward — pick 1</h4>
        <div class="reward-grid">
          <button
            type="button"
            class="reward-card"
            *ngFor="let c of battle.rewardOptions"
            [ngClass]="{ selected: selectedRewardId === c.id }"
            (click)="selectReward(c.id)"
          >
            <div class="entity-media">
              <img *ngIf="rewardImage(c); else noRewardImage" class="img-entity reward-card__img" [src]="rewardImage(c)!" [alt]="c.name" />
              <ng-template #noRewardImage>
                <div class="entity-placeholder reward-card__ph">{{ c.name.slice(0, 2) }}</div>
              </ng-template>
            </div>
            <div class="reward-card__text">
              <strong>{{ c.name }}</strong>
              <span class="reward-card__rarity">{{ c.rarity }}</span>
              <span *ngIf="c.owned" class="reward-card__dup">Duplicate → upgrade</span>
            </div>
          </button>
        </div>
        <button type="button" (click)="claimReward()" [disabled]="selectedRewardId == null">Claim reward</button>
      </div>
      <p class="hint">
        <strong>One action per character per turn:</strong> Attack (no cooldown) or Skill (cooldown {{ battle.skillCooldownAfterUse }} — use Attack on that
        character's later turns to reduce it). From <strong>phase 2</strong> the team unlocks <strong>Focus</strong>; from <strong>phase 3</strong>,
        <strong>Desperation</strong> (once per hero). The boss gains <strong>Crush</strong> then <strong>Fury</strong> on its turns.
      </p>
      <p>
        Round <strong>{{ battle.roundNumber }}</strong> / <strong>{{ battle.maxRounds }}</strong>
        <span class="hint"> (lose if the limit is exceeded)</span>
        · Global steps: <strong>{{ battle.turnsTaken }}</strong>
      </p>

      <div class="boss-panel">
        <h4>Boss</h4>
        <div class="boss-row">
          <div class="entity-media">
            <img
              *ngIf="bossBattleImage(); else noBattleBoss"
              class="img-entity img-entity--4x3 boss-panel__img"
              [src]="bossBattleImage()!"
              alt="Boss"
              loading="lazy"
            />
            <ng-template #noBattleBoss>
              <div class="entity-placeholder boss-panel__ph">No image</div>
            </ng-template>
          </div>
          <div class="boss-panel__stats">
            <p>
              HP: <strong>{{ battle.bossCurrentHp }}</strong> / {{ battle.bossMaxHp }}
              · Phase <strong>{{ battle.bossPhase }}</strong> / 3
            </p>
            <div class="bar bar--phased">
              <div class="fill boss" [style.width.%]="bossHpPercent()"></div>
              <div class="bar__tick" [style.left.%]="bossPhaseTickLowPercent()"></div>
              <div class="bar__tick" [style.left.%]="bossPhaseTickHighPercent()"></div>
            </div>
            <p class="phase-abilities" *ngIf="battle.bossUnlockedAbilities.length || battle.teamUnlockedAbilities.length">
              <span *ngIf="battle.teamUnlockedAbilities.length">
                Team:
                <strong *ngFor="let ab of battle.teamUnlockedAbilities; let last = last">{{ abilityLabel(ab) }}<span *ngIf="!last">, </span></strong>
              </span>
              <span *ngIf="battle.teamUnlockedAbilities.length && battle.bossUnlockedAbilities.length"> · </span>
              <span *ngIf="battle.bossUnlockedAbilities.length">
                Boss:
                <strong *ngFor="let ab of battle.bossUnlockedAbilities; let last = last">{{ abilityLabel(ab) }}<span *ngIf="!last">, </span></strong>
              </span>
            </p>
          </div>
        </div>
      </div>

      <h4>Your team</h4>
      <p *ngIf="battle.expectedCharacterId != null && battle.result === 'IN_PROGRESS'" class="turn-hint">
        Current turn: <strong>{{ currentActorName() }}</strong> (id {{ battle.expectedCharacterId }})
      </p>

      <div class="team-grid">
        <div
          *ngFor="let a of battle.allies"
          class="ally-card"
          [ngClass]="{
            current: battle.expectedCharacterId === a.characterId && battle.result === 'IN_PROGRESS',
            down: a.currentHp <= 0
          }"
        >
          <div class="entity-media entity-media--fill">
            <img
              *ngIf="allyImage(a); else noAlly"
              class="img-entity ally-card__img"
              [src]="allyImage(a)!"
              [alt]="a.name"
              loading="lazy"
            />
            <ng-template #noAlly>
              <div class="entity-placeholder ally-card__ph">{{ a.name.slice(0, 2) }}</div>
            </ng-template>
          </div>
          <h5>{{ a.name }}</h5>
           <p class="stats">ATK {{ a.attack }} · DEF {{ a.defense }} · SPD {{ a.speed }}</p>
           <p class="stats">Level {{ a.level }}</p>
           <p *ngIf="a.passiveKey" class="stats passive">Passive: <strong>{{ a.passiveKey }}</strong> — {{ a.passiveValue }}</p>
          <p>HP: {{ a.currentHp }} / {{ a.maxHp }}</p>
          <div class="bar"><div class="fill ally" [style.width.%]="allyHpPercent(a)"></div></div>
          <p *ngIf="a.skillCooldownRemaining > 0" class="cd">Skill CD: {{ a.skillCooldownRemaining }}</p>
          <p *ngIf="a.desperationUsed" class="cd desperation-tag">Desperation used</p>
        </div>
      </div>

      <div class="actions" *ngIf="battle.result === 'IN_PROGRESS' && battle.expectedCharacterId != null">
        <p>Target the boss — the highlighted character performs exactly one action.</p>
        <button type="button" (click)="attack()">Attack</button>
        <button type="button" (click)="skill()" [disabled]="skillOnCooldown()" [title]="skillButtonTitle()">Skill</button>
        <button
          type="button"
          (click)="focus()"
          *ngIf="focusUnlocked()"
          [title]="focusButtonTitle()"
        >
          Focus
        </button>
        <button
          type="button"
          (click)="desperation()"
          *ngIf="desperationUnlocked()"
          [disabled]="desperationUsedByActor()"
          [title]="desperationButtonTitle()"
        >
          Desperation
        </button>
      </div>

      <h4>Log</h4>
      <ul class="log">
        <li *ngFor="let line of battle.log">{{ line }}</li>
      </ul>
    </section>
  `,
  styles: [
    `
      .form-error-battle {
        color: #b00020;
        margin: 0;
      }
      .start-form__row {
        display: flex;
        flex-wrap: wrap;
        align-items: flex-start;
        gap: 1rem;
        margin-bottom: 8px;
      }
      .start-form__field {
        flex: 1 1 200px;
        min-width: 0;
      }
      .start-preview {
        flex: 0 0 auto;
        text-align: center;
      }
      .start-preview__img {
        max-width: 100px;
      }
      .start-preview__ph {
        max-width: 100px;
        margin: 0 auto;
      }
      .start-preview__caption {
        margin: 6px 0 0;
        font-size: 0.85rem;
        font-weight: 600;
        color: #37474f;
        max-width: 120px;
        line-height: 1.2;
      }
      .hint {
        color: #94a3b8;
        font-size: 0.9rem;
      }
      .energy-line {
        margin-bottom: 12px;
      }
      .cost {
        color: #94a3b8;
        font-size: 0.9rem;
      }
      .battle-field {
        margin-top: 1rem;
      }
      .outcome-banner {
        margin: 0 0 12px;
        padding: 10px 12px;
        border-radius: 8px;
        font-weight: 600;
      }
      .outcome-banner--win {
        background: rgba(34, 197, 94, 0.15);
        color: #22c55e;
        border: 1px solid rgba(34, 197, 94, 0.3);
      }
      .outcome-banner--lose {
        background: rgba(239, 68, 68, 0.15);
        color: #ef4444;
        border: 1px solid rgba(239, 68, 68, 0.3);
      }
      .outcome-banner--draw {
        background: rgba(251, 191, 36, 0.15);
        color: #fbbf24;
        border: 1px solid rgba(251, 191, 36, 0.3);
      }
      .boss-panel {
        margin-bottom: 1rem;
      }
      .boss-row {
        display: flex;
        flex-wrap: wrap;
        gap: 1rem;
        align-items: center;
      }
      .boss-panel__img {
        max-width: min(280px, 100%);
      }
      .boss-panel__ph {
        max-width: 200px;
        min-height: 120px;
      }
      .boss-panel__stats {
        flex: 1 1 200px;
        min-width: 0;
      }
      .ally-card__img {
        aspect-ratio: 1 / 1;
        width: calc(100% + 20px);
        max-width: calc(100% + 20px);
        max-height: 120px;
        object-fit: cover;
        border-radius: 8px 8px 0 0;
        margin: -10px -10px 8px -10px;
        box-shadow: none;
      }
      .ally-card__ph {
        margin: -10px -10px 8px -10px;
        width: calc(100% + 20px);
        max-width: none;
        min-height: 140px;
        border-radius: 8px 8px 0 0;
      }
      .bar {
        height: 8px;
        background: rgba(6, 26, 46, 0.6);
        border-radius: 4px;
        overflow: hidden;
      }
      .bar--phased {
        position: relative;
        overflow: visible;
      }
      .bar--phased .fill {
        border-radius: 4px;
      }
      .bar__tick {
        position: absolute;
        top: -2px;
        bottom: -2px;
        width: 2px;
        margin-left: -1px;
        background: rgba(0, 0, 0, 0.35);
        pointer-events: none;
        border-radius: 1px;
      }
      .phase-abilities {
        font-size: 0.9rem;
        color: #94a3b8;
        margin: 8px 0 0;
      }
      .desperation-tag {
        color: #c084fc;
        font-weight: 600;
      }
      .bar .fill {
        height: 100%;
        transition: width 0.2s ease;
      }
      .bar .fill.boss {
        background: #c62828;
      }
      .bar .fill.ally {
        background: #1565c0;
      }
      .team-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(min(100%, 140px), 1fr));
        gap: 12px;
        margin: 12px 0;
      }
      .ally-card {
        border: 1px solid rgba(250, 204, 21, 0.2);
        border-radius: 8px;
        padding: 10px;
        background: rgba(6, 26, 46, 0.7);
        overflow: hidden;
        color: #ffffff;
      }
      .ally-card.current {
        border-color: #facc15;
        box-shadow: 0 0 0 2px rgba(250, 204, 21, 0.25);
        background: rgba(6, 26, 46, 0.9);
      }
      .ally-card.down {
        opacity: 0.55;
      }
      .stats {
        font-size: 0.85rem;
        color: #cbd5e1;
        margin: 0;
      }
      .stats.passive {
        color: #facc15;
      }
      .cd {
        font-size: 0.85rem;
        color: #f87171;
        font-weight: 600;
      }
      .turn-hint {
        margin: 8px 0;
        color: #94a3b8;
      }
      .actions {
        margin: 16px 0;
      }
      .actions button {
        margin-right: 8px;
      }
      .log {
        max-height: 220px;
        overflow-y: auto;
        padding-left: 1.2rem;
        font-size: 0.9rem;
        color: #cbd5e1;
      }
      .reward-pack {
        margin: 12px 0 16px;
        padding: 12px;
        border: 1px dashed rgba(250, 204, 21, 0.3);
        border-radius: 10px;
        background: rgba(6, 26, 46, 0.5);
      }
      .reward-grid {
        margin: 8px 0 12px;
      }
      .reward-card {
        cursor: pointer;
        text-align: left;
      }
      .reward-card.selected {
        border-color: #1565c0;
        box-shadow: 0 0 0 2px rgba(21, 101, 192, 0.25);
      }
    `,
  ],
})
export class BattleComponent implements OnInit {
  bosses: BossModel[] = [];
  decks: DeckModel[] = [];
  battle?: BattleModel;
  profile?: UserProfile;
  error = "";
  selectedRewardId: number | null = null;
  readonly imageBase = environment.apiUrl;

  startForm = this.fb.group({
    bossId: [1],
    deckId: [1],
    isHardcore: [false],
  });

  constructor(
    private readonly api: GameApiService,
    private readonly auth: AuthService,
    private readonly fb: FormBuilder,
    route: ActivatedRoute
  ) {
    this.api.getBosses().subscribe((res) => (this.bosses = res));
    this.api.getDecks().subscribe((res) => (this.decks = res));
    const qBossId = Number(route.snapshot.queryParamMap.get("bossId") ?? "0");
    if (qBossId > 0) {
      this.startForm.patchValue({ bossId: qBossId });
    }
  }

  ngOnInit(): void {
    this.refreshProfile();
  }

  canStartBattle(): boolean {
    return !!this.profile && this.profile.energy >= 1;
  }

  private refreshProfile(): void {
    this.auth.me().subscribe({
      next: (p) => (this.profile = p),
      error: () => (this.profile = undefined),
    });
  }

  bossHpPercent(): number {
    if (!this.battle || !this.battle.bossMaxHp) return 0;
    return Math.max(0, Math.min(100, (100 * this.battle.bossCurrentHp) / this.battle.bossMaxHp));
  }

  /** Phase boundary at ⌊maxHp/3⌋ (matches backend `BattleRuntimeState`). */
  bossPhaseTickLowPercent(): number {
    if (!this.battle?.bossMaxHp) return 100 / 3;
    const max = this.battle.bossMaxHp;
    const tLow = Math.floor(max / 3);
    return (100 * tLow) / max;
  }

  /** Phase boundary at ⌊2·maxHp/3⌋. */
  bossPhaseTickHighPercent(): number {
    if (!this.battle?.bossMaxHp) return (200 / 3);
    const max = this.battle.bossMaxHp;
    const tHigh = Math.floor((2 * max) / 3);
    return (100 * tHigh) / max;
  }

  abilityLabel(code: string): string {
    switch (code) {
      case "FOCUS":
        return "Focus";
      case "DESPERATION":
        return "Desperation";
      case "CRUSH":
        return "Crush";
      case "FURY":
        return "Fury";
      default:
        return code;
    }
  }

  focusUnlocked(): boolean {
    return !!this.battle?.teamUnlockedAbilities?.includes("FOCUS");
  }

  desperationUnlocked(): boolean {
    return !!this.battle?.teamUnlockedAbilities?.includes("DESPERATION");
  }

  desperationUsedByActor(): boolean {
    return !!this.currentActor()?.desperationUsed;
  }

  focusButtonTitle(): string {
    return "Phase 2+ — stronger hit; no skill cooldown (like Attack)";
  }

  desperationButtonTitle(): string {
    if (this.desperationUsedByActor()) return "Desperation already used for this hero";
    return "Phase 3 — strongest hit once per hero; no skill cooldown (like Attack)";
  }

  outcomeTitle(): string {
    const b = this.battle;
    if (!b) return "";
    if (b.result === "WIN") return "Victory";
    if (b.result === "LOSE") return "Defeat";
    return b.result;
  }

  outcomeSubtitle(): string {
    const b = this.battle;
    if (!b) return "";
    if (b.result === "WIN") {
      return b.lossReason === "BOSS_DEFEATED" || b.lossReason == null ? "boss defeated" : "";
    }
    if (b.result !== "LOSE") return "";
    switch (b.lossReason) {
      case "ALL_HEROES_DEFEATED":
        return "all heroes were defeated";
      case "ROUND_LIMIT":
        return `round limit (${b.maxRounds}) reached`;
      default:
        return "";
    }
  }

  allyHpPercent(a: BattleAllyModel): number {
    if (!a.maxHp) return 0;
    return Math.max(0, Math.min(100, (100 * a.currentHp) / a.maxHp));
  }

  currentActorName(): string {
    if (!this.battle?.expectedCharacterId) return "";
    const a = this.currentActor();
    return a?.name ?? "";
  }

  private currentActor(): BattleAllyModel | undefined {
    if (!this.battle?.expectedCharacterId) return undefined;
    return this.battle.allies.find((x) => x.characterId === this.battle!.expectedCharacterId);
  }

  skillOnCooldown(): boolean {
    const a = this.currentActor();
    return !!a && a.skillCooldownRemaining > 0;
  }

  skillButtonTitle(): string {
    if (!this.skillOnCooldown()) return "Higher damage; starts skill cooldown on this character";
    const a = this.currentActor();
    return `Skill on cooldown (${a?.skillCooldownRemaining ?? 0}): use Attack until it reaches 0`;
  }

  bossBattleImage(): string | null {
    const path = this.battle ? imageSrc(this.battle.bossImageUrl) : null;
    return path ? `${this.imageBase}${path}` : null;
  }

  allyImage(a: BattleAllyModel): string | null {
    const path = imageSrc(a.imageUrl);
    return path ? `${this.imageBase}${path}` : null;
  }

  previewBoss(): BossModel | undefined {
    const raw = this.startForm.get("bossId")?.value;
    const id = Number(raw);
    if (Number.isNaN(id)) return undefined;
    return this.bosses.find((b) => b.id === id);
  }

  bossPortrait(b: BossModel): string | null {
    const path = imageSrc(b.imageUrl);
    return path ? `${this.imageBase}${path}` : null;
  }

  startBattle(): void {
    const raw = this.startForm.getRawValue();
    if (raw.isHardcore && this.profile && !this.profile.hardcoreUnlocked) {
      this.error = "Hardcore mode is locked until all normal bosses are cleared";
      return;
    }
    this.api
      .startBattle({
        bossId: Number(raw.bossId),
        deckId: Number(raw.deckId),
        isHardcore: !!raw.isHardcore,
      })
      .subscribe({
        next: (res) => {
          this.battle = res;
          this.selectedRewardId = null;
          this.error = "";
          this.refreshProfile();
        },
        error: (err) => (this.error = err?.error?.error ?? "Failed to start battle"),
      });
  }

  attack(): void {
    this.dispatch("ATTACK");
  }

  skill(): void {
    this.dispatch("SKILL");
  }

  focus(): void {
    this.dispatch("FOCUS");
  }

  desperation(): void {
    this.dispatch("DESPERATION");
  }

  private dispatch(actionType: "ATTACK" | "SKILL" | "FOCUS" | "DESPERATION"): void {
    if (!this.battle?.expectedCharacterId) return;
    this.api
      .doAction(this.battle.id, {
        actorId: this.battle.expectedCharacterId,
        actionType,
        targetId: this.battle.bossId,
      })
      .subscribe({
        next: (res) => {
          this.battle = res;
          this.selectedRewardId = null;
          this.error = "";
        },
        error: (err) => (this.error = err?.error?.error ?? "Failed action"),
      });
  }

  showRewardPack(): boolean {
    return !!this.battle
      && this.battle.result === "WIN"
      && !this.battle.rewardClaimed
      && this.battle.rewardOptions.length > 0;
  }

  selectReward(id: number): void {
    this.selectedRewardId = id;
  }

  claimReward(): void {
    if (!this.battle || this.selectedRewardId == null) return;
    this.api.claimBattleReward(this.battle.id, this.selectedRewardId).subscribe({
      next: (res) => {
        this.battle = res;
        this.selectedRewardId = null;
        this.error = "";
      },
      error: (err) => (this.error = err?.error?.error ?? "Failed to claim reward"),
    });
  }

  rewardImage(c: CardModel): string | null {
    const path = imageSrc(c.imageUrl);
    return path ? `${this.imageBase}${path}` : null;
  }
}
