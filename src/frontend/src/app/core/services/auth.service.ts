import { Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { Observable, tap } from "rxjs";
import { AuthResponse, Role, UserProfile } from "../models";
import { environment } from "../../../environments/environment";

@Injectable({ providedIn: "root" })
export class AuthService {
  private readonly api = `${environment.apiBaseUrl}/auth`;
  private readonly tokenKey = "invincible_token";
  private readonly roleKey = "invincible_role";

  constructor(private readonly http: HttpClient) {}

  register(payload: { username: string; email: string; password: string }): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(`${this.api}/register`, payload)
      .pipe(tap((res) => this.persistSession(res)));
  }

  login(payload: { username: string; password: string }): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(`${this.api}/login`, payload)
      .pipe(tap((res) => this.persistSession(res)));
  }

  me(): Observable<UserProfile> {
    return this.http.get<UserProfile>(`${this.api}/me`);
  }

  token(): string | null {
    return localStorage.getItem(this.tokenKey);
  }

  currentRole(): Role | null {
    return localStorage.getItem(this.roleKey) as Role | null;
  }

  isLoggedIn(): boolean {
    return !!this.token();
  }

  logout(): void {
    localStorage.removeItem(this.tokenKey);
    localStorage.removeItem(this.roleKey);
  }

  private persistSession(res: AuthResponse): void {
    localStorage.setItem(this.tokenKey, res.token);
    localStorage.setItem(this.roleKey, res.role);
  }
}
