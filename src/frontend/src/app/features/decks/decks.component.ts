import { Component } from "@angular/core";
import { AbstractControl, FormBuilder, ReactiveFormsModule, ValidationErrors, Validators } from "@angular/forms";
import { NgFor, NgIf } from "@angular/common";
import { GameApiService } from "../../core/services/game-api.service";
import { CardModel, DeckModel } from "../../core/models";
import { environment } from "../../../environments/environment";

const parseDeckIds = (raw: unknown): number[] => {
  return String(raw ?? "")
    .split(",")
    .map((s) => Number(s.trim()))
    .filter((n) => !Number.isNaN(n));
};

const deckIdsValidator = (control: AbstractControl): ValidationErrors | null => {
  const ids = parseDeckIds(control.value);
  if (ids.length !== 3) {
    return { count: true };
  }
  return new Set(ids).size === 3 ? null : { distinct: true };
};

@Component({
  standalone: true,
  imports: [ReactiveFormsModule, NgFor, NgIf],
  template: `
    <div class="decks-container">
      <!-- Decks List Section -->
      <section class="card decks-section">
        <div class="decks-header">
          <h2>Your Decks</h2>
          <span class="deck-count">{{ decks.length }}/3 slots used</span>
        </div>
        
        <div class="decks-grid" *ngIf="decks.length > 0">
          <div class="deck-card" *ngFor="let d of decks">
            <div class="deck-card__header">
              <div class="deck-slot-badge">Slot {{ d.slotNumber }}</div>
              <h3 class="deck-name">{{ d.name }}</h3>
              <p class="deck-description">{{ d.description || 'No description' }}</p>
            </div>
            <div class="deck-card__characters">
              <span class="character-pill" *ngFor="let charId of d.characterIds">{{ getCharacterName(charId) }}</span>
            </div>
            <div class="deck-card__actions">
              <button type="button" class="btn-delete" (click)="remove(d.id)">Delete</button>
            </div>
          </div>
        </div>
        
        <div class="empty-state" *ngIf="decks.length === 0">
          <p>No decks yet. Create your first deck below!</p>
        </div>
      </section>

      <!-- Create Deck Form -->
      <section class="card form-section" *ngIf="canCreateDeck">
        <h2>Create New Deck</h2>
        <form [formGroup]="form" (ngSubmit)="createDeck()">
          <div class="form-row">
            <div class="form-field">
              <label>Deck Name</label>
              <input formControlName="name" placeholder="My Awesome Deck" />
            </div>
            <div class="form-field form-field--small">
              <label>Slot</label>
              <select formControlName="slotNumber">
                <option [value]="1">1</option>
                <option [value]="2">2</option>
                <option [value]="3">3</option>
              </select>
            </div>
          </div>
          <div class="form-field">
            <label>Description</label>
            <input formControlName="description" placeholder="Brief description..." />
          </div>
          <div class="form-field">
            <label>Characters <span class="hint">(exactly 3 unique IDs, comma-separated)</span></label>
            <input formControlName="characterIdsCsv" placeholder="1, 5, 12" />
          </div>
          <button type="submit" class="btn-primary" [disabled]="form.invalid">Create Deck</button>
        </form>
        <p *ngIf="form.controls.characterIdsCsv.errors?.['count']" class="form-error">
          Pick exactly 3 characters.
        </p>
        <p *ngIf="form.controls.characterIdsCsv.errors?.['distinct']" class="form-error">
          Characters must be distinct.
        </p>
        <p *ngIf="error" class="form-error">{{ error }}</p>
      </section>

      <section class="card form-section--disabled" *ngIf="!canCreateDeck">
        <h2>Deck Limit Reached</h2>
        <p>You have used all 3 deck slots. Delete an existing deck to create a new one.</p>
      </section>

      <!-- Owned Cards Reference -->
      <section class="card cards-section">
        <h3>Your Collection <span class="subtitle">Click card IDs to use in deck</span></h3>
        <div class="owned-grid">
          <div class="owned-tile" *ngFor="let c of ownedCards" (click)="addToInput(c.id)">
            <div class="entity-media">
              <img *ngIf="c.imageUrl; else noMini" class="img-entity owned-tile__img" [src]="imageBase + c.imageUrl" [alt]="c.name" loading="lazy" />
              <ng-template #noMini>
                <div class="entity-placeholder owned-tile__ph">{{ c.name.slice(0, 2) }}</div>
              </ng-template>
            </div>
            <div class="owned-tile__text">
              <span class="owned-tile__id">ID: {{ c.id }}</span>
              <span class="owned-tile__name">{{ c.name }}</span>
              <span class="owned-tile__rarity" [attr.data-rarity]="c.rarity">{{ c.rarity }}</span>
            </div>
          </div>
        </div>
        <p class="empty-state" *ngIf="ownedCards.length === 0">No cards in your collection yet.</p>
      </section>
    </div>
  `,
  styles: [
    `
      .owned-grid {
        grid-template-columns: repeat(auto-fill, minmax(min(100%, 200px), 1fr));
      }
      .owned-tile {
        display: flex;
        gap: 12px;
        align-items: center;
        padding: 10px;
        border: 1px solid rgba(250, 204, 21, 0.2);
        border-radius: 10px;
        background: rgba(6, 26, 46, 0.7);
        transition: all 0.2s ease;
      }

      .owned-tile:hover {
        border-color: rgba(250, 204, 21, 0.4);
        background: rgba(6, 26, 46, 0.9);
      }
      .owned-tile__img {
        width: 72px;
        height: 72px;
        max-width: 72px;
        aspect-ratio: 1 / 1;
        flex-shrink: 0;
      }
      .owned-tile__ph {
        width: 72px;
        height: 72px;
        max-width: 72px;
        min-height: 72px;
        aspect-ratio: 1 / 1;
        font-size: 0.85rem;
        font-weight: 700;
      }
      .owned-tile__text {
        display: flex;
        flex-direction: column;
        gap: 2px;
        min-width: 0;
      }
      .owned-tile__id {
        font-size: 0.75rem;
        color: #64748b;
      }
      .owned-tile__name {
        font-weight: 600;
        font-size: 0.95rem;
        line-height: 1.25;
        word-break: break-word;
        color: #ffffff;
      }
      .owned-tile__rarity {
        font-size: 0.75rem;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.03em;
        color: #facc15;
      }

      .owned-tile__rarity[data-rarity="COMMON"] {
        color: #94a3b8;
      }

      .owned-tile__rarity[data-rarity="RARE"] {
        color: #60a5fa;
      }

      .owned-tile__rarity[data-rarity="EPIC"] {
        color: #c084fc;
      }

      .owned-tile__rarity[data-rarity="LEGENDARY"] {
        color: #facc15;
      }

      .decks-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 1rem;
        padding-bottom: 0.75rem;
        border-bottom: 1px solid rgba(250, 204, 21, 0.2);
      }

      .decks-header h2 {
        margin: 0;
        font-size: 1.25rem;
        font-weight: 700;
        color: #ffffff;
      }

      .deck-count {
        font-size: 0.875rem;
        color: #94a3b8;
        background: rgba(6, 26, 46, 0.5);
        padding: 0.25rem 0.75rem;
        border-radius: 0.5rem;
      }

      .decks-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(min(100%, 300px), 1fr));
        gap: 1rem;
      }

      .deck-card {
        border: 1px solid rgba(250, 204, 21, 0.2);
        border-radius: 0.75rem;
        padding: 1rem;
        background: rgba(6, 26, 46, 0.5);
        display: flex;
        flex-direction: column;
        gap: 0.75rem;
      }

      .deck-card__header {
        display: flex;
        flex-direction: column;
        gap: 0.25rem;
      }

      .deck-slot-badge {
        font-size: 0.7rem;
        font-weight: 600;
        color: #facc15;
        text-transform: uppercase;
        letter-spacing: 0.05em;
      }

      .deck-name {
        margin: 0;
        font-size: 1.1rem;
        font-weight: 700;
        color: #ffffff;
      }

      .deck-description {
        margin: 0;
        font-size: 0.85rem;
        color: #94a3b8;
        font-style: italic;
      }

      .deck-card__characters {
        display: flex;
        flex-wrap: wrap;
        gap: 0.5rem;
      }

      .character-pill {
        background: rgba(59, 130, 246, 0.2);
        border: 1px solid rgba(59, 130, 246, 0.3);
        color: #60a5fa;
        padding: 0.25rem 0.75rem;
        border-radius: 2rem;
        font-size: 0.85rem;
        font-weight: 500;
      }

      .deck-card__actions {
        display: flex;
        justify-content: flex-end;
        margin-top: auto;
      }

      .btn-delete {
        background: transparent;
        border: 1px solid rgba(239, 68, 68, 0.3);
        color: #ef4444;
        padding: 0.375rem 0.75rem;
        border-radius: 0.5rem;
        font-size: 0.85rem;
        cursor: pointer;
        transition: all 0.2s ease;
      }

      .btn-delete:hover {
        background: rgba(239, 68, 68, 0.1);
        border-color: rgba(239, 68, 68, 0.5);
      }

      .form-section h2 {
        margin: 0 0 1rem;
        font-size: 1.25rem;
        font-weight: 700;
        color: #ffffff;
      }

      .form-section--disabled h2 {
        margin: 0 0 0.5rem;
        font-size: 1.25rem;
        font-weight: 700;
        color: #94a3b8;
      }

      .form-section--disabled p {
        margin: 0;
        color: #94a3b8;
      }

      .form-row {
        display: flex;
        gap: 1rem;
        margin-bottom: 0.75rem;
      }

      .form-field {
        flex: 1;
        margin-bottom: 0.75rem;
      }

      .form-field--small {
        flex: 0 0 80px;
      }

      .form-field label {
        display: block;
        font-size: 0.8rem;
        font-weight: 600;
        color: #cbd5e1;
        margin-bottom: 0.375rem;
      }

      .form-field label .hint {
        font-weight: 400;
        color: #64748b;
      }

      .cards-section h3 {
        margin: 0 0 1rem;
        font-size: 1.1rem;
        font-weight: 600;
        color: #ffffff;
        display: flex;
        align-items: center;
        gap: 0.5rem;
      }

      .cards-section h3 .subtitle {
        font-size: 0.8rem;
        font-weight: 400;
        color: #64748b;
      }

      .empty-state {
        text-align: center;
        padding: 2rem;
        color: #64748b;
        font-style: italic;
      }
    `,
  ],
})
export class DecksComponent {
  imageBase = environment.apiUrl;
  decks: DeckModel[] = [];
  ownedCards: CardModel[] = [];
  error = "";

  form = this.fb.group({
    name: ["", Validators.required],
    description: [""],
    slotNumber: [1, Validators.required],
    characterIdsCsv: ["", [Validators.required, deckIdsValidator]],
  });

  constructor(private readonly api: GameApiService, private readonly fb: FormBuilder) {
    this.refresh();
    this.api.getCards(true).subscribe((cards) => (this.ownedCards = cards));
  }

  createDeck(): void {
    if (!this.canCreateDeck) {
      this.error = "Maximum 3 decks allowed";
      return;
    }
    const raw = this.form.getRawValue();
    const ids = parseDeckIds(raw.characterIdsCsv ?? "");
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

  get canCreateDeck(): boolean {
    return this.decks.length < 3;
  }


  getCharacterName(charId: number): string {
    const card = this.ownedCards.find((c) => c.id === charId);
    return card ? card.name : `ID: ${charId}`;
  }

  addToInput(id: number): void {
    const control = this.form.controls.characterIdsCsv;
    const current = control.value || "";
    const ids = parseDeckIds(current);

    if (ids.includes(id)) return;

    if (current.trim()) {
      control.setValue(`${current}, ${id}`);
    } else {
      control.setValue(`${id}`);
    }
  }
}
