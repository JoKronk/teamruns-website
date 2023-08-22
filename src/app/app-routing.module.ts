import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { IndexComponent } from './index/index.component';
import { LeaderboardComponent } from './leaderboard/leaderboard.component';
import { ObsRunComponent } from './obs-run/obs-run.component';

const routes: Routes = [
  { path: 'obs', component: ObsRunComponent },
  { path: 'leaderboards', component: LeaderboardComponent },
  { path: '', component: IndexComponent, pathMatch: 'full' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
