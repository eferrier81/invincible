import { Component, OnDestroy, OnInit } from "@angular/core";
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

      <div class="energy-block" *ngIf="profile">
        <h2>Energy</h2>
        <p>
          <strong>{{ profile.energy }}</strong> / {{ profile.maxEnergy }}
          <span class="hint"> — {{ energyCostHint }}</span>
        </p>
        <div class="bar">
          <div class="fill" [style.width.%]="energyPercent()"></div>
        </div>
        <p *ngIf="profile.energy < profile.maxEnergy && countdownText" class="regen">
          Next +1 in <strong>{{ countdownText }}</strong>
        </p>
        <p *ngIf="profile.energy >= profile.maxEnergy" class="full">Energy full.</p>
      </div>

      <p *ngIf="error" style="color:#b00020">{{ error }}</p>
    </section>
  `,
  styles: [
    `
      .energy-block h2 {
        font-size: 1.1rem;
        margin-bottom: 0.5rem;
      }
      .hint {
        color: #666;
        font-weight: normal;
        font-size: 0.9rem;
      }
      .bar {
        height: 10px;
        background: #eee;
        border-radius: 5px;
        overflow: hidden;
        max-width: 320px;
      }
      .bar .fill {
        height: 100%;
        background: linear-gradient(90deg, #2e7d32, #66bb6a);
        transition: width 0.3s ease;
      }
      .regen {
        margin-top: 8px;
        font-size: 0.95rem;
        color: #555;
      }
      .full {
        margin-top: 8px;
        color: #2e7d32;
      }
    `,
  ],
})
export class DashboardComponent implements OnInit, OnDestroy {
  profile?: UserProfile;
  error = "";
  countdownText = "";
  readonly energyCostHint = "1 energy per battle · +1 each hour (max 5)";

  private poll?: ReturnType<typeof setInterval>;
  private tick?: ReturnType<typeof setInterval>;
  private remainingSeconds = 0;

  constructor(private readonly auth: AuthService) {}

  ngOnInit(): void {
    this.loadProfile();
    this.poll = setInterval(() => this.loadProfile(), 60_000);
    this.tick = setInterval(() => this.onTick(), 1000);
  }

  ngOnDestroy(): void {
    if (this.poll) clearInterval(this.poll);
    if (this.tick) clearInterval(this.tick);
  }

  energyPercent(): number {
    if (!this.profile?.maxEnergy) return 0;
    return Math.max(0, Math.min(100, (100 * this.profile.energy) / this.profile.maxEnergy));
  }

  private loadProfile(): void {
    this.auth.me().subscribe({
      next: (res) => {
        this.profile = res;
        this.error = "";
        if (res.secondsUntilNextEnergy != null) {
          this.remainingSeconds = res.secondsUntilNextEnergy;
        } else {
          this.remainingSeconds = 0;
        }
        this.updateCountdownLabel();
      },
      error: (err) => (this.error = err?.error?.error ?? "Unable to load profile"),
    });
  }

  private onTick(): void {
    if (!this.profile || this.profile.energy >= this.profile.maxEnergy) {
      this.countdownText = "";
      return;
    }
    const prev = this.remainingSeconds;
    if (this.remainingSeconds > 0) {
      this.remainingSeconds--;
    }
    this.updateCountdownLabel();
    if (prev === 1 && this.remainingSeconds === 0) {
      this.loadProfile();
    }
  }

  private updateCountdownLabel(): void {
    if (!this.profile || this.profile.energy >= this.profile.maxEnergy) {
      this.countdownText = "";
      return;
    }
    const s = Math.max(0, this.remainingSeconds);
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    if (h > 0) {
      this.countdownText = `${h}h ${m}m ${sec}s`;
    } else if (m > 0) {
      this.countdownText = `${m}m ${sec}s`;
    } else {
      this.countdownText = `${sec}s`;
    }
  }
}
