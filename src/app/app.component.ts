import { Component } from '@angular/core';
import { NavigationStart, Router } from '@angular/router';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  title = 'Teamruns';

  showNavbar: boolean = false;

  constructor(public router: Router) {
    router.events.subscribe(event => {
      if (event instanceof NavigationStart) {
        //this.showNavbar = event.url.startsWith("/guides");
      }
    });
  }
}
