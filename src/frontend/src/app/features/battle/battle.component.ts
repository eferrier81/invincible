import { Component } from "@angular/core";
import { FormBuilder, ReactiveFormsModule } from "@angular/forms";
import { NgFor, NgIf } from "@angular/common";
import { ActivatedRoute } from "@angular/router";
import { BattleModel, BossModel, DeckModel } from "../../core/models";
import { GameApiService } from "../../core/services/game-api.service";

@Component({
  standalone: true,
  imports: [ReactiveFormsModule, NgIf, NgFor],
  template: `
    <section class="card">
      <h2>Battle</h2>
      <form [formGroup]="startForm" (ngSubmit)="startBattle()">
        <div>
          <label>Boss</label>
          <select formControlName="bossId">
            <option *ngFor="let b of bosses" [value]="b.id">{{ b.id }} - {{ b.name }}</option>
          </select>
        </div>
        <div>
          <label>Deck</label>
          <select formControlName="deckId">
            <option *ngFor="let d of decks" [value]="d.id">{{ d.id }} - {{ d.name }}</option>
          </select>
        </div>
        <label><input type="checkbox" formControlName="isHardcore" /> Hardcore</label><br />
        <button type="submit">Start battle</button>
      </form>
      <p *ngIf="error" style="color:#b00020">{{ error }}</p>
    </section>

    <section class="card" *ngIf="battle">
      <h3>Battle #{{ battle.id }} - {{ battle.result }}</h3>
      <p>Turns: {{ battle.turnsTaken }}</p>
      <p>Boss HP: {{ battle.bossCurrentHp }} | Team HP: {{ battle.teamCurrentHp }}</p>
      <button (click)="attack()" [disabled]="battle.result !== 'IN_PROGRESS'">Attack</button>
      <button (click)="skill()" [disabled]="battle.result !== 'IN_PROGRESS'">Skill</button>
      <h4>Log</h4>
      <p *ngFor="let line of battle.log">{{ line }}</p>
    </section>
  `,
})
export class BattleComponent {
  bosses: BossModel[] = [];
  decks: DeckModel[] = [];
  battle?: BattleModel;
  error = "";

  startForm = this.fb.group({
    bossId: [1],
    deckId: [1],
    isHardcore: [false],
  });

  constructor(private readonly api: GameApiService, private readonly fb: FormBuilder, route: ActivatedRoute) {
    this.api.getBosses().subscribe((res) => (this.bosses = res));
    this.api.getDecks().subscribe((res) => (this.decks = res));
    const qBossId = Number(route.snapshot.queryParamMap.get("bossId") ?? "0");
    if (qBossId > 0) {
      this.startForm.patchValue({ bossId: qBossId });
    }
  }

  startBattle(): void {
    const raw = this.startForm.getRawValue();
    this.api
      .startBattle({
        bossId: Number(raw.bossId),
        deckId: Number(raw.deckId),
        isHardcore: !!raw.isHardcore,
      })
      .subscribe({
        next: (res) => {
          this.battle = res;
          this.error = "";
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

  private dispatch(actionType: "ATTACK" | "SKILL"): void {
    if (!this.battle) return;
    this.api
      .doAction(this.battle.id, {
        actorId: 1,
        actionType,
        targetId: 1,
      })
      .subscribe({
        next: (res) => (this.battle = res),
        error: (err) => (this.error = err?.error?.error ?? "Failed action"),
      });
  }
}
