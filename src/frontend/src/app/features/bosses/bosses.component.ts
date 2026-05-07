import { Component } from "@angular/core";
import { NgFor, NgIf } from "@angular/common";
import { RouterLink } from "@angular/router";
import { GameApiService } from "../../core/services/game-api.service";
import { BossModel } from "../../core/models";
import { imageSrc } from "../../core/image-url";
import { environment } from "../../../environments/environment";

@Component({
  standalone: true,
  imports: [NgFor, NgIf, RouterLink],
  template: `
    <section class="card">
      <h2>Bosses</h2>
      <p *ngIf="error" class="form-error">{{ error }}</p>
    </section>

    <div class="grid-responsive">
      <section class="card boss-card" *ngFor="let b of bosses">
        <div class="boss-card__inner">
          <div class="entity-media">
            <img *ngIf="img(b); else noBoss" class="img-entity img-entity--1x1" [src]="img(b)!" [alt]="b.name" loading="lazy" />
            <ng-template #noBoss>
              <div class="entity-placeholder">No image</div>
            </ng-template>
          </div>
          <div class="boss-card__body">
            <h3 class="boss-card__title">{{ b.name }} <small>({{ b.difficulty }})</small></h3>
            <p class="boss-card__stats">HP {{ b.maxHp }} · ATK {{ b.attack }} · DEF {{ b.defense }} · SPD {{ b.speed }}</p>
            <p class="boss-card__desc">{{ b.description }}</p>
            <a class="boss-card__cta" [routerLink]="['/battle']" [queryParams]="{ bossId: b.id }">Fight this boss</a>
          </div>
        </div>
      </section>
    </div>
  `,
  styles: [
    `
      .form-error {
        color: #b00020;
        margin: 0;
      }
      .boss-card {
        margin-bottom: 0;
        height: 100%;
        box-sizing: border-box;
      }
      .boss-card__inner {
        display: flex;
        flex-direction: column;
        gap: 1rem;
        height: 100%;
      }
      @media (min-width: 520px) {
        .boss-card__inner {
          flex-direction: row;
          align-items: flex-start;
        }
      }
      .boss-card__body {
        flex: 1;
        min-width: 0;
      }
      .boss-card__title {
        margin: 0 0 0.5rem;
        font-size: 1.15rem;
        line-height: 1.3;
      }
      .boss-card__title small {
        font-weight: 500;
        color: #546e7a;
      }
      .boss-card__stats {
        margin: 0 0 0.5rem;
        font-size: 0.9rem;
        color: #455a64;
      }
      .boss-card__desc {
        margin: 0 0 1rem;
        font-size: 0.95rem;
        line-height: 1.45;
        color: #37474f;
      }
      .boss-card__cta {
        display: inline-block;
        font-weight: 600;
        margin-top: auto;
      }
    `,
  ],
})
export class BossesComponent {
  bosses: BossModel[] = [];
  error = "";
  readonly imageBase = environment.apiUrl;

  img(b: BossModel): string | null {
    const path = imageSrc(b.imageUrl);
    return path ? `${this.imageBase}${path}` : null;
  }

  constructor(private readonly api: GameApiService) {
    this.api.getBosses().subscribe({
      next: (res) => (this.bosses = res),
      error: (err) => (this.error = err?.error?.error ?? "Failed to load bosses"),
    });
  }
}
