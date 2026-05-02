import { Component } from "@angular/core";
import { NgFor, NgIf } from "@angular/common";
import { RouterLink } from "@angular/router";
import { GameApiService } from "../../core/services/game-api.service";
import { BossModel } from "../../core/models";

@Component({
  standalone: true,
  imports: [NgFor, NgIf, RouterLink],
  template: `
    <section class="card">
      <h2>Bosses</h2>
      <p *ngIf="error" style="color:#b00020">{{ error }}</p>
    </section>
    <section class="card" *ngFor="let b of bosses">
      <h3>{{ b.name }} <small>({{ b.difficulty }})</small></h3>
      <p>HP {{ b.maxHp }} | ATK {{ b.attack }} | DEF {{ b.defense }} | SPD {{ b.speed }}</p>
      <p>{{ b.description }}</p>
      <a [routerLink]="['/battle']" [queryParams]="{ bossId: b.id }">Fight this boss</a>
    </section>
  `,
})
export class BossesComponent {
  bosses: BossModel[] = [];
  error = "";

  constructor(private readonly api: GameApiService) {
    this.api.getBosses().subscribe({
      next: (res) => (this.bosses = res),
      error: (err) => (this.error = err?.error?.error ?? "Failed to load bosses"),
    });
  }
}
