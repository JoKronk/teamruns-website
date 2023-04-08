import { Injectable, NgZone } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { SnackbarComponent } from '../snackbar/snackbar.component';
import { User } from '../common/user/user';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class UserService {

  user: User = new User();
  
  viewSettings: boolean = false;
  trackerConnected: boolean = false;

  constructor(private _snackbar: MatSnackBar, private zone: NgZone, private router: Router) { 
    this.user.id = "OBS-" + crypto.randomUUID();
  }

  public getName() {
    return this.user.name;
  }

  public getId() {
    return this.user.id;
  }

  public routeTo(link: string) {
    this.router.navigate([link]);
  }

  public sendNotification(message: string, notifDuration: number = 5000) {
    this.zone.run(() => {
      this._snackbar.openFromComponent(SnackbarComponent, {
        duration: notifDuration,
        data: message,
        verticalPosition: 'bottom',
        horizontalPosition: 'right'
      });
    });
  }

  public copyLink(link: string) {
    const selBox = document.createElement('textarea');
    selBox.style.position = 'fixed';
    selBox.style.left = '0';
    selBox.style.top = '0';
    selBox.style.opacity = '0';
    selBox.value = link;
    document.body.appendChild(selBox);
    selBox.focus();
    selBox.select();
    document.execCommand('copy');
    document.body.removeChild(selBox);

    this.sendNotification("Link Copied!");
  }

}
