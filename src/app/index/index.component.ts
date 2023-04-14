import { HttpClient } from '@angular/common/http';
import { Component } from '@angular/core';

@Component({
  selector: 'app-index',
  templateUrl: './index.component.html',
  styleUrls: ['./index.component.scss']
})
export class IndexComponent {

  tag: string = "";

  constructor(private httpClient: HttpClient) {
    this.httpClient.get('https://api.github.com/repos/JoKronk/TeamRun-Client/tags').subscribe(tags => {
      this.tag = (tags as Tag[]).sort(function (a, b) {
        return ('' + b.name).localeCompare(a.name);
      })[0].name.substring(1);
    });

  }

}

class Tag {
  name: string
}