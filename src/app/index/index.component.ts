import { HttpClient } from '@angular/common/http';
import { Component } from '@angular/core';
import { Release } from '../common/web/release';

@Component({
  selector: 'app-index',
  templateUrl: './index.component.html',
  styleUrls: ['./index.component.scss']
})
export class IndexComponent {

  release: string = "";

  constructor(private httpClient: HttpClient) {
    this.httpClient.get('https://api.github.com/repos/JoKronk/teamruns-client/releases').subscribe(releases => {
      this.release = (releases as Release[]).sort(function (a, b) {
        let dateA = Date.parse(a.published_at),
          dateB = Date.parse(b.published_at);
        return dateB - dateA;
      })[0].name.substring(1);
    });

  }

}