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
      <h2>Register</h2>
      <form [formGroup]="form" (ngSubmit)="submit()">
        <div>
          <label>Username</label><br />
          <input formControlName="username" />
        </div>
        <div>
          <label>Email</label><br />
          <input type="email" formControlName="email" />
        </div>
        <div>
          <label>Password</label><br />
          <input type="password" formControlName="password" />
        </div>
        <button type="submit" [disabled]="form.invalid || loading">Create account</button>
      </form>
      <p *ngIf="error" style="color:#b00020">{{ error }}</p>
      <p>Already have account? <a routerLink="/login">Login</a></p>
    </section>
  `,
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
