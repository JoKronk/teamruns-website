import { Component, HostListener, NgZone, OnDestroy } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Subscription } from 'rxjs';
import { PlayerState } from '../common/player/player-state';
import { RunHandler } from '../common/run/run-handler';
import { RunState } from '../common/run/run-state';
import { LocalPlayerData } from '../common/user/local-player-data';
import { FireStoreService } from '../services/fire-store.service';
import { UserService } from '../services/user.service';
import { Lobby } from '../common/firestore/lobby';

@Component({
  selector: 'app-obs-run',
  templateUrl: './obs-run.component.html',
  styleUrls: ['./obs-run.component.scss']
})
export class ObsRunComponent implements OnDestroy {

  localPlayer: LocalPlayerData = new LocalPlayerData(this._user.user.getUserBase());
  runHandler: RunHandler | undefined;

  width: number = 320;
  height: string = "800";
  backgroundColor: string = "#4e4e4e";
  timerBorder: boolean = false;
  currentLobbyId: string | null = null;
  
  playerState = PlayerState;
  runState = RunState;

  lobbiesSubscription: Subscription; 

  constructor(public _user: UserService, private firestoreService: FireStoreService, private route: ActivatedRoute, private zone: NgZone) {

    this.route.queryParamMap.subscribe((params) => {
      const userId = params.get('user');
      this.height = params.get('height') ?? this.height;
      this.backgroundColor = params.get('bgColor') ?? this.backgroundColor;
      this.timerBorder = (params.get('timerBorder') ?? "false") === "true";
      this._user.user.name = params.get('obsName') ?? "";
      if (!userId) return;
      this.setupLobbyListner(userId);
    });
  }

  async setupLobbyListner(userId: string) {
    this.lobbiesSubscription = (await this.firestoreService.getUserLobby(userId)).subscribe((lobbies) => {

      if (lobbies && lobbies.length !== 0) {
        let playerLobby = lobbies.sort((x, y) => new Date(y.lastUpdateDate).valueOf() - new Date(x.lastUpdateDate).valueOf())[0];
        playerLobby = Object.assign(new Lobby(playerLobby.runData, playerLobby.creatorId, playerLobby.password, playerLobby.id), playerLobby)
        

        //return if still in same lobby
        if ((this.currentLobbyId === playerLobby.id || playerLobby.getUser(this.localPlayer.user.id)) && this.runHandler) {
          this.runHandler.onLobbyChange(playerLobby);
          return;
        }

        this.currentLobbyId = playerLobby.id;

        //remove user from old lobbies if any
        this.removeUserFromLobbies(userId, lobbies.filter(x => x.id !== this.currentLobbyId));

        this.setupNewLobby(userId, playerLobby);
      }

      
      //handle deletion
      else if (this.runHandler && this.currentLobbyId)
        this.handleDeletion();
    });
  }

  async handleDeletion() {
    setTimeout(async () => { //allow runHandler to get player leave change and set host to null if runner was the only one left in lobby
      if (this.runHandler) this.runHandler.destroy();
      this.runHandler = undefined;

      if (!this.currentLobbyId) return;

      (await this.firestoreService.getLobbyDoc(this.currentLobbyId!)).ref.get().then(snapshot => {
        let lobby = snapshot.data();
        if (!lobby) return;

        lobby = Object.assign(new Lobby(lobby.runData, lobby.creatorId, lobby.password, lobby.id), lobby);
        lobby.removeUser(this.localPlayer.user.id);
        this.firestoreService.updateLobby(lobby);
        this.currentLobbyId = null;
      });
      this.currentLobbyId = null;
      this.localPlayer = new LocalPlayerData(this._user.user.getUserBase());
    }, 300);
  }

  setupNewLobby(userId: string, lobby: Lobby) {
    //set name
    if (!this._user.user.name)
      this._user.user.name = "OBS-" + lobby.getUser(userId)?.name + "-" + crypto.randomUUID().slice(0, 8);
      
      
    //create run
    setTimeout(() => { //second user causes duplicated run objects if it updates the lobby upon joining too quickly
      this.runHandler = new RunHandler(lobby, this.firestoreService, this._user, this.localPlayer, this.zone, userId);
    }, 300);
  }

  //purely done to reduce db reads as every lobby returned when the users lobbies are returned counts as 1 read
  removeUserFromLobbies(userId: string, lobbies: Lobby[]) {
    if (lobbies.length === 0) return;
    
    lobbies.forEach(lobby => {
      lobby.users = lobby.users.filter(x => x.id !== userId);
      lobby.runnerIds = lobby.runnerIds.filter(x => x !== userId);
      this.firestoreService.updateLobby(lobby);
    });
  }

  ngOnDestroy(): void {
    this.lobbiesSubscription.unsubscribe();
    if (this.runHandler)
      this.runHandler.destroy();
  }
}
