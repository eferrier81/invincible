import { Component } from "@angular/core";
import { NgFor, NgIf } from "@angular/common";
import { GameApiService } from "../../core/services/game-api.service";
import { CardModel } from "../../core/models";
import { environment } from "../../../environments/environment";

@Component({
  standalone: true,
  imports: [NgFor, NgIf],
  template: `
    <section class="card">
      <div class="collection-header">
        <h2>Collection</h2>
        <div class="toolbar">
          <button type="button" (click)="load(true)" class="secondary">Owned Only</button>
          <button type="button" (click)="load(false)">All Cards</button>
        </div>
      </div>
      <p *ngIf="error" class="form-error">{{ error }}</p>
    </section>

    <div class="grid-responsive collection-grid">
      <article class="card char-card" *ngFor="let c of cards">
        <div class="char-card__media entity-media entity-media--fill">
          <img *ngIf="c.imageUrl; else noChar" class="img-entity char-card__img" [src]="imageBase + c.imageUrl" [alt]="c.name" loading="lazy" />
          <ng-template #noChar>
            <div class="entity-placeholder char-card__placeholder">No image</div>
          </ng-template>
        </div>
        <div class="char-card__body">
          <h3 class="char-card__title">{{ c.name }} <small [attr.data-rarity]="c.rarity">{{ c.rarity }}</small></h3>
          <p class="char-card__meta">{{ c.faction }}</p>
          <div class="char-card__stats">
            <span>HP {{ c.maxHp }}</span>
            <span>ATK {{ c.attack }}</span>
            <span>DEF {{ c.defense }}</span>
            <span>SPD {{ c.speed }}</span>
          </div>
          <p *ngIf="c.owned" class="char-card__level">⭐ Level {{ c.level ?? 1 }}</p>
          <p *ngIf="c.passiveKey && c.owned" class="char-card__passive">{{ c.passiveKey }} — {{ c.passiveValue }}</p>
          <p class="char-card__owned" [class.char-card__owned--yes]="c.owned">
            {{ c.owned ? "✓ Owned" : "✗ Not owned" }}
          </p>
          <p *ngIf="c.owned && c.duplicateCount" class="char-card__upgrade">↑ Upgrades: +{{ upgradeBonusPercent(c) }}%</p>
        </div>
      </article>
    </div>
  `,
  styles: [
    `
      .collection-header {
        display: flex;
        flex-wrap: wrap;
        justify-content: space-between;
        align-items: center;
        gap: 1rem;
        margin-bottom: 0.5rem;
      }

      .collection-header h2 {
        margin: 0;
      }

      .toolbar {
        display: flex;
        flex-wrap: wrap;
        gap: 0.5rem;
      }

      .collection-grid {
        grid-template-columns: repeat(auto-fill, minmax(min(100%, 240px), 1fr));
      }
      .char-card {
        margin-bottom: 0;
        display: flex;
        flex-direction: column;
        height: 100%;
        overflow: hidden;
        padding: 0;
      }
      .char-card__media {
        border-radius: 8px 8px 0 0;
      }
      .char-card__img {
        aspect-ratio: 1 / 1;
        max-width: none;
        width: 100%;
        border-radius: 0;
        box-shadow: none;
      }
      .char-card__placeholder {
        max-width: none;
        width: 100%;
        min-height: 160px;
        border-radius: 0;
      }
      .char-card__body {
        padding: 12px;
        flex: 1;
        display: flex;
        flex-direction: column;
      }
      .char-card__title {
        margin: 0 0 4px;
        font-size: 1.05rem;
        line-height: 1.3;
      }
      .char-card__title small {
        font-weight: 600;
        color: #5c6bc0;
        text-transform: uppercase;
        font-size: 0.7rem;
        letter-spacing: 0.04em;
      }
      .char-card__meta {
        margin: 0 0 8px;
        font-size: 0.85rem;
        color: #607d8b;
      }
      .char-card__stats {
        margin: 0 0 8px;
        font-size: 0.88rem;
        color: #455a64;
        line-height: 1.4;
      }
      .char-card__level {
        margin: 0 0 6px;
        font-size: 0.85rem;
        font-weight: 600;
        color: #455a64;
      }
      .char-card__passive {
        margin: 0 0 8px;
        font-size: 0.85rem;
        color: #37474f;
      }
      .char-card__owned {
        margin: auto 0 0;
        font-size: 0.8rem;
        font-weight: 600;
        color: #78909c;
      }
      .char-card__owned--yes {
        color: #2e7d32;
      }
      .char-card__upgrade {
        margin: 6px 0 0;
        font-size: 0.8rem;
        color: #5c6bc0;
        font-weight: 600;
      }
    `,
  ],
})
export class CollectionComponent {
  imageBase = environment.apiUrl;
  cards: CardModel[] = [];
  error = "";

  constructor(private readonly api: GameApiService) {
    this.load(true);
  }

  load(owned: boolean): void {
    this.api.getCards(owned).subscribe({
      next: (res) => (this.cards = res),
      error: (err) => (this.error = err?.error?.error ?? "Failed to load cards"),
    });
  }

  upgradeBonusPercent(c: CardModel): number {
    const upgrades = c.abilityUpgradeIndex ?? 0;
    return upgrades * 5;
  }
}
