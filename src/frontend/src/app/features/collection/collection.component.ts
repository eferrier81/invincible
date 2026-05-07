import { Component } from "@angular/core";
import { NgFor, NgIf } from "@angular/common";
import { GameApiService } from "../../core/services/game-api.service";
import { CardModel } from "../../core/models";
import { imageSrc } from "../../core/image-url";

@Component({
  standalone: true,
  imports: [NgFor, NgIf],
  template: `
    <section class="card">
      <h2>Collection</h2>
      <div class="toolbar">
        <button type="button" (click)="load(true)">Owned only</button>
        <button type="button" (click)="load(false)">All cards</button>
      </div>
      <p *ngIf="error" class="form-error">{{ error }}</p>
    </section>

    <div class="grid-responsive collection-grid">
      <article class="card char-card" *ngFor="let c of cards">
        <div class="char-card__media entity-media entity-media--fill">
          <img *ngIf="img(c); else noChar" class="img-entity char-card__img" [src]="img(c)!" [alt]="c.name" loading="lazy" />
          <ng-template #noChar>
            <div class="entity-placeholder char-card__placeholder">No image</div>
          </ng-template>
        </div>
        <div class="char-card__body">
          <h3 class="char-card__title">{{ c.name }} <small>{{ c.rarity }}</small></h3>
          <p class="char-card__meta">{{ c.faction }}</p>
          <p class="char-card__stats">HP {{ c.maxHp }} · ATK {{ c.attack }} · DEF {{ c.defense }} · SPD {{ c.speed }}</p>
          <p *ngIf="c.owned" class="char-card__level">Level {{ c.level ?? 1 }}</p>
          <p *ngIf="c.passiveKey" class="char-card__passive">Passive: <strong>{{ c.passiveKey }}</strong> — {{ c.passiveValue }}</p>
          <p class="char-card__owned" [class.char-card__owned--yes]="c.owned">{{ c.owned ? "Owned" : "Not owned" }}</p>
          <p *ngIf="c.owned" class="char-card__upgrade">Skill upgrades: +{{ upgradeBonusPercent(c) }}%</p>
        </div>
      </article>
    </div>
  `,
  styles: [
    `
      .toolbar {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
        margin-bottom: 8px;
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

  img(c: CardModel): string | null {
    return imageSrc(c.imageUrl);
  }

  upgradeBonusPercent(c: CardModel): number {
    const upgrades = c.abilityUpgradeIndex ?? 0;
    return upgrades * 5;
  }
}
