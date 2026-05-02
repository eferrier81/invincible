import { Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { Observable } from "rxjs";
import { BattleModel, BossModel, CardModel, DeckModel } from "../models";
import { environment } from "../../../environments/environment";

@Injectable({ providedIn: "root" })
export class GameApiService {
  private readonly api = environment.apiBaseUrl;

  constructor(private readonly http: HttpClient) {}

  getCards(owned = false): Observable<CardModel[]> {
    return this.http.get<CardModel[]>(`${this.api}/cards?owned=${owned}`);
  }

  getBosses(): Observable<BossModel[]> {
    return this.http.get<BossModel[]>(`${this.api}/bosses`);
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
    return this.http.post<BattleModel>(`${this.api}/battles/start`, payload);
  }

  doAction(
    battleId: number,
    payload: { actorId: number; actionType: "ATTACK" | "SKILL"; skillId?: number; targetId: number }
  ): Observable<BattleModel> {
    return this.http.post<BattleModel>(`${this.api}/battles/${battleId}/action`, payload);
  }

  getBattle(id: number): Observable<BattleModel> {
    return this.http.get<BattleModel>(`${this.api}/battles/${id}`);
  }

  getHistory(): Observable<BattleModel[]> {
    return this.http.get<BattleModel[]>(`${this.api}/battles/history`);
  }
}
