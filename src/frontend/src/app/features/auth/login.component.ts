import { Component } from "@angular/core";
import { FormBuilder, ReactiveFormsModule, Validators } from "@angular/forms";
import { AuthService } from "../../core/services/auth.service";
import { Router, RouterLink } from "@angular/router";
import { NgIf } from "@angular/common";

@Component({
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, NgIf],
  template: `
    <div class="auth-container">
      <section class="card auth-card">
        <div class="auth-header">
          <h1>Welcome Back</h1>
          <p class="auth-subtitle">Sign in to continue your adventure</p>
        </div>

        <form [formGroup]="form" (ngSubmit)="submit()" class="auth-form">
          <div class="form-group">
            <label for="username">Username</label>
            <input id="username" formControlName="username" placeholder="Enter your username" autocomplete="username" />
          </div>

          <div class="form-group">
            <label for="password">Password</label>
            <input id="password" type="password" formControlName="password" placeholder="Enter your password" autocomplete="current-password" />
          </div>

          <button type="submit" [disabled]="form.invalid || loading" class="auth-submit">
            <span *ngIf="loading">Signing in...</span>
            <span *ngIf="!loading">Sign In</span>
          </button>
        </form>

        <p *ngIf="error" class="form-error auth-error">{{ error }}</p>

        <div class="auth-footer">
          <p>Don't have an account? <a routerLink="/register">Create one</a></p>
        </div>
      </section>
    </div>
  `,
  styles: [`
    .auth-container {
      min-height: calc(100vh - 200px);
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 2rem 1rem;
    }

    .auth-card {
      width: 100%;
      max-width: 420px;
      margin: 0;
      text-align: center;
    }

    .auth-header {
      margin-bottom: 2rem;
    }

    .auth-header h1 {
      margin: 0 0 0.5rem;
      font-size: 1.75rem;
      font-weight: 800;
      color: #facc15;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .auth-subtitle {
      margin: 0;
      color: #94a3b8;
      font-size: 0.9375rem;
    }

    .auth-form {
      text-align: left;
    }

    .auth-form .form-group {
      margin-bottom: 1.25rem;
    }

    .auth-submit {
      width: 100%;
      margin-top: 0.5rem;
      padding: 0.875rem 1.5rem;
      font-size: 1rem;
    }

    .auth-error {
      margin-top: 1rem;
      text-align: center;
    }

    .auth-footer {
      margin-top: 1.5rem;
      padding-top: 1.5rem;
      border-top: 1px solid rgba(255, 255, 255, 0.1);
    }

    .auth-footer p {
      margin: 0;
      color: #94a3b8;
      font-size: 0.875rem;
    }

    .auth-footer a {
      font-weight: 600;
    }
  `]
})
export class LoginComponent {
  loading = false;
  error = "";
  form = this.fb.group({
    username: ["", [Validators.required]],
    password: ["", [Validators.required]],
  });

  constructor(private readonly fb: FormBuilder, private readonly auth: AuthService, private readonly router: Router) {}

  submit(): void {
    if (this.form.invalid) return;
    this.loading = true;
    this.error = "";
    this.auth.login(this.form.getRawValue() as { username: string; password: string }).subscribe({
      next: () => this.router.navigateByUrl("/dashboard"),
      error: (err) => {
        this.error = err?.error?.error ?? "Login failed";
        this.loading = false;
      },
    });
  }
}
