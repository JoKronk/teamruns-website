import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { IndexComponent } from './index/index.component';
import { LeaderboardComponent } from './leaderboard/leaderboard.component';
import { RandomCellComponent } from './random-cell/random-cell.component';
import { FaqComponent } from './faq/faq.component';
import { HelpComponent } from './guides/help/help.component';
import { IssuesComponent } from './issues/issues.component';

const routes: Routes = [
  { path: 'rco', component: RandomCellComponent },
  { path: 'leaderboards', component: LeaderboardComponent },
  { path: 'faq', component: FaqComponent },
  { path: 'guides', component: HelpComponent },
  { path: 'issues', component: IssuesComponent },
  { path: '', component: IndexComponent, pathMatch: 'full' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
