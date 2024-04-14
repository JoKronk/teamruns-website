import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { IndexComponent } from './index/index.component';
import { LeaderboardComponent } from './leaderboard/leaderboard.component';
import { RandomCellComponent } from './random-cell/random-cell.component';

const routes: Routes = [
  { path: 'rco', component: RandomCellComponent },
  { path: 'leaderboards', component: LeaderboardComponent },
  { path: '', component: IndexComponent, pathMatch: 'full' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
