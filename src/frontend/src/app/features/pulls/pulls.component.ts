import { Component, OnInit } from "@angular/core";
import { NgFor, NgIf } from "@angular/common";
import { GameApiService } from "../../core/services/game-api.service";
import { CardModel, PullResultModel, PullStatusModel } from "../../core/models";
import { imageSrc } from "../../core/image-url";

@Component({
  standalone: true,
  imports: [NgIf, NgFor],
  template: `
    <section class="card">
      <h2>Pulls / Packs</h2>
      <div class="pull-actions">
        <button type="button" (click)="doWelcome()" [disabled]="!status?.welcomeAvailable">Welcome pull (3 cards)</button>
        <button type="button" (click)="doDaily()" [disabled]="!status?.dailyAvailable">Daily pull (1 card)</button>
      </div>
      <p *ngIf="status && !status.dailyAvailable" class="hint">Next daily: {{ status.nextDailyAt ?? "tomorrow" }}</p>
      <p *ngIf="!status" class="hint">Loading status…</p>
      <p *ngIf="error" class="form-error">{{ error }}</p>
    </section>

    <section class="card" *ngIf="lastResult">
      <h3>{{ lastResult.type }} pack</h3>
      <div class="reward-grid">
        <div class="reward-card" *ngFor="let c of lastResult.cards">
          <div class="entity-media">
            <img *ngIf="img(c); else noImage" class="img-entity reward-card__img" [src]="img(c)!" [alt]="c.name" />
            <ng-template #noImage>
              <div class="entity-placeholder reward-card__ph">{{ c.name.slice(0, 2) }}</div>
            </ng-template>
          </div>
          <div class="reward-card__text">
            <strong>{{ c.name }}</strong>
            <span class="reward-card__rarity">{{ c.rarity }}</span>
            <span *ngIf="c.owned" class="reward-card__dup">Owned (duplicate upgrade)</span>
          </div>
        </div>
      </div>
    </section>
  `,
  styles: [
    `
      .pull-actions {
        display: flex;
        flex-wrap: wrap;
        gap: 12px;
        margin: 8px 0 10px;
      }
      .hint {
        color: #555;
        font-size: 0.9rem;
        margin: 0;
      }
      .form-error {
        color: #b00020;
        margin: 8px 0 0;
      }
      .reward-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
        gap: 12px;
      }
      .reward-card {
        border: 1px solid #e0e0e0;
        border-radius: 10px;
        padding: 8px;
        background: #fff;
      }
      .reward-card__img {
        width: 100%;
        aspect-ratio: 1 / 1;
        border-radius: 8px;
        margin-bottom: 6px;
      }
      .reward-card__ph {
        width: 100%;
        aspect-ratio: 1 / 1;
        border-radius: 8px;
        margin-bottom: 6px;
      }
      .reward-card__text {
        display: flex;
        flex-direction: column;
        gap: 4px;
        font-size: 0.9rem;
      }
      .reward-card__rarity {
        text-transform: uppercase;
        letter-spacing: 0.04em;
        font-size: 0.75rem;
        color: #5c6bc0;
      }
      .reward-card__dup {
        font-size: 0.75rem;
        color: #455a64;
      }
    `,
  ],
})
export class PullsComponent implements OnInit {
  status?: PullStatusModel;
  lastResult?: PullResultModel;
  error = "";

  constructor(private readonly api: GameApiService) {}

  ngOnInit(): void {
    this.loadStatus();
  }

  doWelcome(): void {
    this.api.welcomePull().subscribe({
      next: (res) => {
        this.lastResult = res;
        this.status = res.status;
        this.error = "";
      },
      error: (err) => (this.error = err?.error?.error ?? "Failed to claim welcome pull"),
    });
  }

  doDaily(): void {
    this.api.dailyPull().subscribe({
      next: (res) => {
        this.lastResult = res;
        this.status = res.status;
        this.error = "";
      },
      error: (err) => (this.error = err?.error?.error ?? "Failed to claim daily pull"),
    });
  }

  private loadStatus(): void {
    this.api.getPullStatus().subscribe({
      next: (res) => {
        this.status = res;
        this.error = "";
      },
      error: (err) => (this.error = err?.error?.error ?? "Failed to load pull status"),
    });
  }

  img(c: CardModel): string | null {
    return imageSrc(c.imageUrl);
  }
}
