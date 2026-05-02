import { Component } from "@angular/core";
import { FormBuilder, ReactiveFormsModule, Validators } from "@angular/forms";
import { AuthService } from "../../core/services/auth.service";
import { Router, RouterLink } from "@angular/router";
import { NgIf } from "@angular/common";

@Component({
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, NgIf],
  template: `
    <section class="card">
      <h2>Login</h2>
      <form [formGroup]="form" (ngSubmit)="submit()">
        <div>
          <label>Username</label><br />
          <input formControlName="username" />
        </div>
        <div>
          <label>Password</label><br />
          <input type="password" formControlName="password" />
        </div>
        <button type="submit" [disabled]="form.invalid || loading">Login</button>
      </form>
      <p *ngIf="error" style="color:#b00020">{{ error }}</p>
      <p>No account? <a routerLink="/register">Register</a></p>
    </section>
  `,
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
