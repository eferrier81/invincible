import { Component } from "@angular/core";
import { NgFor, NgIf } from "@angular/common";
import { GameApiService } from "../../core/services/game-api.service";
import { CardModel } from "../../core/models";

@Component({
  standalone: true,
  imports: [NgFor, NgIf],
  template: `
    <section class="card">
      <h2>Collection</h2>
      <button (click)="load(true)">Owned only</button>
      <button (click)="load(false)">All cards</button>
      <p *ngIf="error" style="color:#b00020">{{ error }}</p>
    </section>
    <section class="card" *ngFor="let c of cards">
      <h3>{{ c.name }} <small>({{ c.rarity }})</small></h3>
      <p>Faction: {{ c.faction }} | HP: {{ c.maxHp }} | ATK: {{ c.attack }} | DEF: {{ c.defense }} | SPD: {{ c.speed }}</p>
      <p>Owned: {{ c.owned ? "Yes" : "No" }}</p>
    </section>
  `,
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
}
