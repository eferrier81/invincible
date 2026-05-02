import { Component } from "@angular/core";
import { NgIf } from "@angular/common";
import { HttpClient } from "@angular/common/http";
import { environment } from "../../../environments/environment";

@Component({
  standalone: true,
  imports: [NgIf],
  template: `
    <section class="card">
      <h2>Admin</h2>
      <button (click)="check()">Check admin endpoint</button>
      <pre *ngIf="result">{{ result }}</pre>
      <p *ngIf="error" style="color:#b00020">{{ error }}</p>
    </section>
  `,
})
export class AdminComponent {
  result = "";
  error = "";

  constructor(private readonly http: HttpClient) {}

  check(): void {
    this.http.get(`${environment.apiBaseUrl}/admin/health`).subscribe({
      next: (res) => {
        this.result = JSON.stringify(res, null, 2);
        this.error = "";
      },
      error: (err) => {
        this.error = err?.error?.error ?? "Admin endpoint failed";
      },
    });
  }
}
