import { bootstrapApplication } from "@angular/platform-browser";
import { Component } from "@angular/core";
import { appConfig } from "./app/app.config";
import { RouterLink, RouterLinkActive, RouterOutlet } from "@angular/router";
import { NgIf } from "@angular/common";
import { inject } from "@angular/core";
import { AuthService } from "./app/core/services/auth.service";

@Component({
  selector: "app-root",
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, NgIf],
  template: `
    <header class="topbar">
      <nav class="nav">
        <a routerLink="/dashboard" routerLinkActive="active">Dashboard</a>
        <a routerLink="/collection" routerLinkActive="active" *ngIf="isLoggedIn()">Collection</a>
        <a routerLink="/decks" routerLinkActive="active" *ngIf="isLoggedIn()">Decks</a>
        <a routerLink="/bosses" routerLinkActive="active" *ngIf="isLoggedIn()">Bosses</a>
        <a routerLink="/battle" routerLinkActive="active" *ngIf="isLoggedIn()">Battle</a>
        <a routerLink="/admin" routerLinkActive="active" *ngIf="isAdmin()">Admin</a>
        <a routerLink="/login" routerLinkActive="active" *ngIf="!isLoggedIn()">Login</a>
        <a routerLink="/register" routerLinkActive="active" *ngIf="!isLoggedIn()">Register</a>
      </nav>
      <button *ngIf="isLoggedIn()" (click)="logout()">Logout</button>
    </header>
    <main class="page">
      <router-outlet></router-outlet>
    </main>
  `,
})
class AppComponent {
  private readonly auth = inject(AuthService);

  isLoggedIn(): boolean {
    return this.auth.isLoggedIn();
  }

  isAdmin(): boolean {
    return this.auth.currentRole() === "ADMIN";
  }

  logout(): void {
    this.auth.logout();
    window.location.href = "/login";
  }
}

bootstrapApplication(AppComponent, {
  ...appConfig,
}).catch((err) => console.error(err));
