import { Routes } from "@angular/router";
import { authGuard } from "./core/guards/auth.guard";
import { adminGuard } from "./core/guards/admin.guard";

export const routes: Routes = [
  { path: "", redirectTo: "login", pathMatch: "full" },
  {
    path: "login",
    loadComponent: () => import("./features/auth/login.component").then((m) => m.LoginComponent),
  },
  {
    path: "register",
    loadComponent: () => import("./features/auth/register.component").then((m) => m.RegisterComponent),
  },
  {
    path: "dashboard",
    canActivate: [authGuard],
    loadComponent: () =>
      import("./features/dashboard/dashboard.component").then(
        (m) => m.DashboardComponent
      ),
  },
  {
    path: "collection",
    canActivate: [authGuard],
    loadComponent: () => import("./features/collection/collection.component").then((m) => m.CollectionComponent),
  },
  {
    path: "decks",
    canActivate: [authGuard],
    loadComponent: () => import("./features/decks/decks.component").then((m) => m.DecksComponent),
  },
  {
    path: "bosses",
    canActivate: [authGuard],
    loadComponent: () => import("./features/bosses/bosses.component").then((m) => m.BossesComponent),
  },
  {
    path: "battle",
    canActivate: [authGuard],
    loadComponent: () => import("./features/battle/battle.component").then((m) => m.BattleComponent),
  },
  {
    path: "admin",
    canActivate: [authGuard, adminGuard],
    loadComponent: () => import("./features/admin/admin.component").then((m) => m.AdminComponent),
  },
  { path: "**", redirectTo: "login" },
];
