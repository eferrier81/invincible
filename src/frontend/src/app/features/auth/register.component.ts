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
          <h1>Create Account</h1>
          <p class="auth-subtitle">Join the battle against the Viltrumite threat</p>
        </div>

        <form [formGroup]="form" (ngSubmit)="submit()" class="auth-form">
          <div class="form-group">
            <label for="username">Username</label>
            <input id="username" formControlName="username" placeholder="Choose a username" autocomplete="username" />
          </div>

          <div class="form-group">
            <label for="email">Email</label>
            <input id="email" type="email" formControlName="email" placeholder="your@email.com" autocomplete="email" />
          </div>

          <div class="form-group">
            <label for="password">Password</label>
            <input id="password" type="password" formControlName="password" placeholder="Min. 8 characters" autocomplete="new-password" />
          </div>

          <button type="submit" [disabled]="form.invalid || loading" class="auth-submit success">
            <span *ngIf="loading">Creating account...</span>
            <span *ngIf="!loading">Create Account</span>
          </button>
        </form>

        <p *ngIf="error" class="form-error auth-error">{{ error }}</p>

        <div class="auth-footer">
          <p>Already have an account? <a routerLink="/login">Sign in</a></p>
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
      font-weight: 700;
      background: linear-gradient(135deg, #34d399, #10b981);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }

    .auth-subtitle {
      margin: 0;
      color: var(--color-gray-400);
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
      color: var(--color-gray-400);
      font-size: 0.875rem;
    }

    .auth-footer a {
      font-weight: 600;
    }
  `]
})
export class RegisterComponent {
  loading = false;
  error = "";
  form = this.fb.group({
    username: ["", [Validators.required, Validators.minLength(3)]],
    email: ["", [Validators.required, Validators.email]],
    password: ["", [Validators.required, Validators.minLength(8)]],
  });

  constructor(private readonly fb: FormBuilder, private readonly auth: AuthService, private readonly router: Router) {}

  submit(): void {
    if (this.form.invalid) return;
    this.loading = true;
    this.error = "";
    this.auth
      .register(this.form.getRawValue() as { username: string; email: string; password: string })
      .subscribe({
        next: () => this.router.navigateByUrl("/dashboard"),
        error: (err) => {
          this.error = err?.error?.error ?? "Register failed";
          this.loading = false;
        },
      });
  }
}
