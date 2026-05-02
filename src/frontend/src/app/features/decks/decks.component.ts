import { Component } from "@angular/core";
import { FormBuilder, ReactiveFormsModule, Validators } from "@angular/forms";
import { NgFor, NgIf } from "@angular/common";
import { GameApiService } from "../../core/services/game-api.service";
import { CardModel, DeckModel } from "../../core/models";

@Component({
  standalone: true,
  imports: [ReactiveFormsModule, NgFor, NgIf],
  template: `
    <section class="card">
      <h2>Deck Builder</h2>
      <form [formGroup]="form" (ngSubmit)="createDeck()">
        <div><input formControlName="name" placeholder="Deck name" /></div>
        <div><input formControlName="description" placeholder="Description" /></div>
        <div>
          <label>Slot</label>
          <select formControlName="slotNumber">
            <option [value]="1">1</option>
            <option [value]="2">2</option>
            <option [value]="3">3</option>
          </select>
        </div>
        <div>
          <label>Characters (comma-separated ids, exactly 3)</label>
          <input formControlName="characterIdsCsv" placeholder="1,2,3" />
        </div>
        <button type="submit" [disabled]="form.invalid">Save deck</button>
      </form>
      <p *ngIf="error" style="color:#b00020">{{ error }}</p>
    </section>

    <section class="card">
      <h3>Owned cards</h3>
      <p *ngFor="let c of ownedCards">{{ c.id }} - {{ c.name }} ({{ c.rarity }})</p>
    </section>

    <section class="card" *ngFor="let d of decks">
      <h3>{{ d.name }} (slot {{ d.slotNumber }})</h3>
      <p>{{ d.description }}</p>
      <p>Characters: {{ d.characterIds.join(", ") }}</p>
      <button (click)="remove(d.id)">Delete</button>
    </section>
  `,
})
export class DecksComponent {
  decks: DeckModel[] = [];
  ownedCards: CardModel[] = [];
  error = "";

  form = this.fb.group({
    name: ["", Validators.required],
    description: [""],
    slotNumber: [1, Validators.required],
    characterIdsCsv: ["", Validators.required],
  });

  constructor(private readonly api: GameApiService, private readonly fb: FormBuilder) {
    this.refresh();
    this.api.getCards(true).subscribe((cards) => (this.ownedCards = cards));
  }

  createDeck(): void {
    const raw = this.form.getRawValue();
    const ids = (raw.characterIdsCsv ?? "")
      .split(",")
      .map((s) => Number(s.trim()))
      .filter((n) => !Number.isNaN(n));
    this.api
      .createDeck({
        name: raw.name ?? "",
        description: raw.description ?? "",
        slotNumber: Number(raw.slotNumber ?? 1),
        characterIds: ids,
      })
      .subscribe({
        next: () => {
          this.form.reset({ name: "", description: "", slotNumber: 1, characterIdsCsv: "" });
          this.refresh();
        },
        error: (err) => (this.error = err?.error?.error ?? "Failed to save deck"),
      });
  }

  remove(id: number): void {
    this.api.deleteDeck(id).subscribe({
      next: () => this.refresh(),
      error: (err) => (this.error = err?.error?.error ?? "Failed to delete deck"),
    });
  }

  private refresh(): void {
    this.api.getDecks().subscribe({
      next: (res) => (this.decks = res),
      error: (err) => (this.error = err?.error?.error ?? "Failed to load decks"),
    });
  }
}
