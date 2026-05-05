import { Component } from "@angular/core";
import { AbstractControl, FormBuilder, ReactiveFormsModule, ValidationErrors, Validators } from "@angular/forms";
import { NgFor, NgIf } from "@angular/common";
import { GameApiService } from "../../core/services/game-api.service";
import { CardModel, DeckModel } from "../../core/models";
import { imageSrc } from "../../core/image-url";

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
        <button type="submit" [disabled]="form.invalid || !canCreateDeck">Save deck</button>
      </form>
      <p *ngIf="form.controls.characterIdsCsv.errors?.['count']" class="form-error">
        Pick exactly 3 characters.
      </p>
      <p *ngIf="form.controls.characterIdsCsv.errors?.['distinct']" class="form-error">
        Characters must be distinct.
      </p>
      <p *ngIf="!canCreateDeck" class="form-error">You already have 3 decks. Delete one to save another.</p>
      <p *ngIf="error" class="form-error">{{ error }}</p>
    </section>

    <section class="card">
      <h3>Owned cards</h3>
      <div class="grid-responsive owned-grid">
        <div class="owned-tile" *ngFor="let c of ownedCards">
          <div class="entity-media">
            <img *ngIf="img(c); else noMini" class="img-entity owned-tile__img" [src]="img(c)!" [alt]="c.name" loading="lazy" />
            <ng-template #noMini>
              <div class="entity-placeholder owned-tile__ph">{{ c.name.slice(0, 2) }}</div>
            </ng-template>
          </div>
          <div class="owned-tile__text">
            <span class="owned-tile__id">{{ c.id }}</span>
            <span class="owned-tile__name">{{ c.name }}</span>
            <span class="owned-tile__rarity">{{ c.rarity }}</span>
          </div>
        </div>
      </div>
    </section>

    <section class="card" *ngFor="let d of decks">
      <h3>{{ d.name }} (slot {{ d.slotNumber }})</h3>
      <p>{{ d.description }}</p>
      <p>Characters: {{ d.characterIds.join(", ") }}</p>
      <button type="button" (click)="remove(d.id)">Delete</button>
    </section>
  `,
  styles: [
    `
      .form-error {
        color: #b00020;
        margin: 0;
      }
      .owned-grid {
        grid-template-columns: repeat(auto-fill, minmax(min(100%, 200px), 1fr));
      }
      .owned-tile {
        display: flex;
        gap: 12px;
        align-items: center;
        padding: 10px;
        border: 1px solid #e0e0e0;
        border-radius: 10px;
        background: #fafafa;
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
        color: #78909c;
      }
      .owned-tile__name {
        font-weight: 600;
        font-size: 0.95rem;
        line-height: 1.25;
        word-break: break-word;
      }
      .owned-tile__rarity {
        font-size: 0.8rem;
        color: #5c6bc0;
        text-transform: uppercase;
        letter-spacing: 0.03em;
      }
    `,
  ],
})
export class DecksComponent {
  decks: DeckModel[] = [];
  ownedCards: CardModel[] = [];
  error = "";

  form = this.fb.group({
    name: ["", Validators.required],
    description: [""],
    slotNumber: [1, Validators.required],
    characterIdsCsv: ["", [Validators.required, this.threeIdsValidator]],
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

  get canCreateDeck(): boolean {
    return this.decks.length < 3;
  }

  private threeIdsValidator(control: AbstractControl): ValidationErrors | null {
    const raw = String(control.value ?? "");
    const ids = raw
      .split(",")
      .map((s) => Number(s.trim()))
      .filter((n) => !Number.isNaN(n));

    if (ids.length !== 3) {
      return { count: true };
    }

    return new Set(ids).size === 3 ? null : { distinct: true };
  }

  img(c: CardModel): string | null {
    return imageSrc(c.imageUrl);
  }
}
