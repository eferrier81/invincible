import { Component, OnDestroy, OnInit } from "@angular/core";
import { NgIf } from "@angular/common";
import { RouterLink } from "@angular/router";
import { AuthService } from "../../core/services/auth.service";
import { UserProfile } from "../../core/models";

@Component({
  selector: "app-dashboard",
  standalone: true,
  imports: [NgIf, RouterLink],
  template: `
    <div class="dashboard" *ngIf="profile">
      <!-- Welcome Section -->
      <section class="card welcome-card">
        <div class="welcome-content">
          <div class="welcome-text">
            <h1>Welcome back, {{ profile.username }}!</h1>
            <p class="role-badge" [class.admin]="profile.role === 'ADMIN'">{{ profile.role }}</p>
          </div>
        </div>
      </section>

      <!-- Stats Grid -->
      <div class="stats-grid">
        <!-- Energy Card -->
        <section class="card stat-card energy-card">
          <div class="stat-header">
            <span class="stat-icon">⚡</span>
            <h2>Energy</h2>
          </div>
          <div class="energy-display">
            <span class="energy-value">{{ profile.energy }}</span>
            <span class="energy-separator">/</span>
            <span class="energy-max">{{ profile.maxEnergy }}</span>
          </div>
          <div class="energy-bar-container">
            <div class="energy-bar" [style.width.%]="energyPercent()">
              <div class="energy-glow"></div>
            </div>
          </div>
          <p class="energy-hint">{{ energyCostHint }}</p>
          <div class="energy-status">
            <p *ngIf="profile.energy < profile.maxEnergy && countdownText" class="countdown">
              Next +1 in <span class="countdown-time">{{ countdownText }}</span>
            </p>
            <p *ngIf="profile.energy >= profile.maxEnergy" class="energy-full">⚡ Energy Full!</p>
          </div>
        </section>

        <!-- Progress Card -->
        <section class="card stat-card progress-card">
          <div class="stat-header">
            <span class="stat-icon">🏆</span>
            <h2>Progress</h2>
          </div>
          <div class="progress-stats">
            <div class="progress-item">
              <span class="progress-value">{{ profile.clearedBosses }}</span>
              <span class="progress-label">Bosses Defeated</span>
            </div>
            <div class="progress-divider"></div>
            <div class="progress-item">
              <span class="progress-value">{{ profile.totalBosses }}</span>
              <span class="progress-label">Total Bosses</span>
            </div>
          </div>
          <div class="progress-bar-container">
            <div class="progress-bar" [style.width.%]="(profile.clearedBosses / profile.totalBosses) * 100"></div>
          </div>
          <p class="progress-status" *ngIf="profile.hardcoreUnlocked">🔥 Hardcore Mode Unlocked!</p>
          <p class="progress-status locked" *ngIf="!profile.hardcoreUnlocked">
            Clear all bosses to unlock Hardcore Mode
          </p>
        </section>
      </div>

      <!-- Quick Actions -->
      <section class="card actions-card">
        <h2>Quick Actions</h2>
        <div class="actions-grid">
          <a routerLink="/battle" class="action-btn primary">
            <span class="action-icon">⚔️</span>
            <span class="action-label">Start Battle</span>
          </a>
          <a routerLink="/pulls" class="action-btn">
            <span class="action-icon">🎁</span>
            <span class="action-label">Daily Pull</span>
          </a>
          <a routerLink="/collection" class="action-btn">
            <span class="action-icon">🃏</span>
            <span class="action-label">My Collection</span>
          </a>
          <a routerLink="/decks" class="action-btn">
            <span class="action-icon">🎒</span>
            <span class="action-label">Manage Decks</span>
          </a>
        </div>
      </section>

      <p *ngIf="error" class="form-error dashboard-error">{{ error }}</p>
    </div>

    <div *ngIf="!profile && !error" class="loading">Loading...</div>
  `,
  styles: [`
    .dashboard {
      max-width: 900px;
      margin: 0 auto;
    }

    .welcome-card {
      background: linear-gradient(135deg, rgba(99, 102, 241, 0.2), rgba(168, 85, 247, 0.15));
      border-color: rgba(99, 102, 241, 0.3);
    }

    .welcome-content {
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    .welcome-text h1 {
      margin: 0 0 0.5rem;
      font-size: 1.5rem;
      font-weight: 700;
    }

    .role-badge {
      display: inline-block;
      padding: 0.25rem 0.75rem;
      background: var(--color-primary);
      color: white;
      font-size: 0.75rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      border-radius: var(--radius);
      margin: 0;
    }

    .role-badge.admin {
      background: linear-gradient(135deg, #f59e0b, #ef4444);
    }

    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 1.5rem;
      margin-bottom: 1.5rem;
    }

    .stat-card {
      margin-bottom: 0;
    }

    .stat-header {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      margin-bottom: 1rem;
    }

    .stat-icon {
      font-size: 1.25rem;
    }

    .stat-header h2 {
      margin: 0;
      font-size: 1rem;
      font-weight: 600;
      color: var(--color-gray-300);
    }

    /* Energy Card */
    .energy-display {
      display: flex;
      align-items: baseline;
      gap: 0.25rem;
      margin-bottom: 0.75rem;
    }

    .energy-value {
      font-size: 2.5rem;
      font-weight: 700;
      color: var(--color-success);
      line-height: 1;
    }

    .energy-separator {
      font-size: 1.5rem;
      color: var(--color-gray-500);
    }

    .energy-max {
      font-size: 1.25rem;
      color: var(--color-gray-400);
    }

    .energy-bar-container {
      height: 12px;
      background: rgba(15, 23, 42, 0.5);
      border-radius: var(--radius);
      overflow: hidden;
      margin-bottom: 0.75rem;
    }

    .energy-bar {
      height: 100%;
      background: linear-gradient(90deg, #10b981, #34d399);
      border-radius: var(--radius);
      transition: width 0.5s ease;
      position: relative;
    }

    .energy-glow {
      position: absolute;
      top: 0;
      right: 0;
      bottom: 0;
      width: 20px;
      background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3));
    }

    .energy-hint {
      font-size: 0.8125rem;
      color: var(--color-gray-400);
      margin: 0 0 0.75rem;
    }

    .energy-status {
      padding-top: 0.75rem;
      border-top: 1px solid rgba(255, 255, 255, 0.1);
    }

    .countdown {
      margin: 0;
      font-size: 0.875rem;
      color: var(--color-gray-300);
    }

    .countdown-time {
      font-weight: 600;
      color: var(--color-primary-light);
    }

    .energy-full {
      margin: 0;
      font-size: 0.875rem;
      font-weight: 600;
      color: var(--color-success);
    }

    /* Progress Card */
    .progress-stats {
      display: flex;
      align-items: center;
      gap: 1rem;
      margin-bottom: 1rem;
    }

    .progress-item {
      display: flex;
      flex-direction: column;
      align-items: center;
    }

    .progress-value {
      font-size: 2rem;
      font-weight: 700;
      color: var(--color-white);
      line-height: 1;
    }

    .progress-label {
      font-size: 0.75rem;
      color: var(--color-gray-400);
      text-transform: uppercase;
      letter-spacing: 0.05em;
      margin-top: 0.25rem;
    }

    .progress-divider {
      width: 1px;
      height: 40px;
      background: rgba(255, 255, 255, 0.1);
    }

    .progress-bar-container {
      height: 8px;
      background: rgba(15, 23, 42, 0.5);
      border-radius: var(--radius);
      overflow: hidden;
      margin-bottom: 0.75rem;
    }

    .progress-bar {
      height: 100%;
      background: linear-gradient(90deg, #6366f1, #a855f7);
      border-radius: var(--radius);
      transition: width 0.5s ease;
    }

    .progress-status {
      margin: 0.75rem 0 0;
      font-size: 0.8125rem;
      font-weight: 600;
      color: var(--color-warning);
    }

    .progress-status.locked {
      color: var(--color-gray-500);
    }

    /* Actions Card */
    .actions-card h2 {
      margin: 0 0 1rem;
      font-size: 1.125rem;
    }

    .actions-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
      gap: 1rem;
    }

    .action-btn {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.5rem;
      padding: 1.25rem 1rem;
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: var(--radius-lg);
      text-decoration: none;
      transition: all var(--transition);
    }

    .action-btn:hover {
      background: rgba(99, 102, 241, 0.15);
      border-color: rgba(99, 102, 241, 0.4);
      transform: translateY(-2px);
      box-shadow: var(--shadow-lg);
    }

    .action-btn.primary {
      background: rgba(99, 102, 241, 0.2);
      border-color: rgba(99, 102, 241, 0.4);
    }

    .action-btn.primary:hover {
      background: rgba(99, 102, 241, 0.3);
    }

    .action-icon {
      font-size: 1.75rem;
    }

    .action-label {
      font-size: 0.8125rem;
      font-weight: 500;
      color: var(--color-gray-200);
    }

    .action-btn:hover .action-label {
      color: var(--color-white);
    }

    .dashboard-error {
      margin-top: 1rem;
      text-align: center;
    }

    @media (max-width: 640px) {
      .stats-grid {
        grid-template-columns: 1fr;
      }

      .actions-grid {
        grid-template-columns: repeat(2, 1fr);
      }

      .welcome-text h1 {
        font-size: 1.25rem;
      }
    }
  `],
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
