import { Component } from "@angular/core";
import { NgIf } from "@angular/common";
import { AuthService } from "../../core/services/auth.service";
import { UserProfile } from "../../core/models";

@Component({
  selector: "app-dashboard",
  standalone: true,
  imports: [NgIf],
  template: `
    <section class="card">
      <h1>Dashboard</h1>
      <p *ngIf="profile">Welcome <strong>{{ profile.username }}</strong> ({{ profile.role }})</p>
      <p *ngIf="profile">Current energy: <strong>{{ profile.energy }}</strong></p>
      <p *ngIf="error" style="color:#b00020">{{ error }}</p>
    </section>
  `,
})
export class DashboardComponent {
  profile?: UserProfile;
  error = "";

  constructor(private readonly auth: AuthService) {
    this.auth.me().subscribe({
      next: (res) => (this.profile = res),
      error: (err) => (this.error = err?.error?.error ?? "Unable to load profile"),
    });
  }
}
