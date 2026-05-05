import { Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { Observable } from "rxjs";
import { map } from "rxjs/operators";
import { normalizeBattle, normalizeBoss, normalizeCard, normalizePullResult, normalizePullStatus } from "../api-normalize";
import { BattleModel, BossModel, CardModel, DeckModel, PullResultModel, PullStatusModel } from "../models";
import { environment } from "../../../environments/environment";

@Injectable({ providedIn: "root" })
export class GameApiService {
  private readonly api = environment.apiBaseUrl;

  constructor(private readonly http: HttpClient) {}

  getCards(owned = false): Observable<CardModel[]> {
    return this.http
      .get<Record<string, unknown>[]>(`${this.api}/cards?owned=${owned}`)
      .pipe(map((rows) => rows.map(normalizeCard)));
  }

  getBosses(): Observable<BossModel[]> {
    return this.http
      .get<Record<string, unknown>[]>(`${this.api}/bosses`)
      .pipe(map((rows) => rows.map(normalizeBoss)));
  }

  getDecks(): Observable<DeckModel[]> {
    return this.http.get<DeckModel[]>(`${this.api}/decks`);
  }

  createDeck(payload: {
    name: string;
    description: string;
    characterIds: number[];
    slotNumber: number;
  }): Observable<DeckModel> {
    return this.http.post<DeckModel>(`${this.api}/decks`, payload);
  }

  updateDeck(
    id: number,
    payload: {
      name: string;
      description: string;
      characterIds: number[];
      slotNumber: number;
    }
  ): Observable<DeckModel> {
    return this.http.put<DeckModel>(`${this.api}/decks/${id}`, payload);
  }

  deleteDeck(id: number): Observable<void> {
    return this.http.delete<void>(`${this.api}/decks/${id}`);
  }

  startBattle(payload: { bossId: number; deckId: number; isHardcore: boolean }): Observable<BattleModel> {
    return this.http
      .post<Record<string, unknown>>(`${this.api}/battles/start`, payload)
      .pipe(map(normalizeBattle));
  }

  doAction(
    battleId: number,
    payload: {
      actorId: number;
      actionType: "ATTACK" | "SKILL" | "FOCUS" | "DESPERATION";
      skillId?: number;
      targetId: number;
    }
  ): Observable<BattleModel> {
    return this.http
      .post<Record<string, unknown>>(`${this.api}/battles/${battleId}/action`, payload)
      .pipe(map(normalizeBattle));
  }

  getBattle(id: number): Observable<BattleModel> {
    return this.http.get<Record<string, unknown>>(`${this.api}/battles/${id}`).pipe(map(normalizeBattle));
  }

  getHistory(): Observable<BattleModel[]> {
    return this.http
      .get<Record<string, unknown>[]>(`${this.api}/battles/history`)
      .pipe(map((rows) => rows.map(normalizeBattle)));
  }

  claimBattleReward(battleId: number, characterId: number): Observable<BattleModel> {
    return this.http
      .post<Record<string, unknown>>(`${this.api}/battles/${battleId}/claim-reward`, { characterId })
      .pipe(map(normalizeBattle));
  }

  getPullStatus(): Observable<PullStatusModel> {
    return this.http
      .get<Record<string, unknown>>(`${this.api}/pulls/status`)
      .pipe(map(normalizePullStatus));
  }

  welcomePull(): Observable<PullResultModel> {
    return this.http
      .post<Record<string, unknown>>(`${this.api}/pulls/welcome`, {})
      .pipe(map(normalizePullResult));
  }

  dailyPull(): Observable<PullResultModel> {
    return this.http
      .post<Record<string, unknown>>(`${this.api}/pulls/daily`, {})
      .pipe(map(normalizePullResult));
  }
}
