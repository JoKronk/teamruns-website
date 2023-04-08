import { Run } from "./run";
import { RunMode } from "./run-mode";
import { LocalPlayerData } from "../user/local-player-data";
import { Lobby } from "../firestore/lobby";
import { RTCPeerSlave } from "../peer/rtc-peer-slave";
import { UserService } from "src/app/services/user.service";
import { Subscription } from "rxjs";
import { DataChannelEvent } from "../peer/data-channel-event";
import { EventType } from "../peer/event-type";
import { PlayerState } from "../player/player-state";
import { RunState } from "./run-state";
import { NgZone } from "@angular/core";
import { Task } from "../opengoal/task";
import { OG } from "../opengoal/og";
import { LobbyUser } from "../firestore/lobby-user";
import { UserBase } from "../user/user";
import { FireStoreService } from "src/app/services/fire-store.service";
import { Player } from "../player/player";

export class RunHandler {
    
    lobby: Lobby | undefined;
    run: Run | undefined;

    connected: boolean = false;
    info: string = "";
    isBeingDestroyed: boolean = false;

    localSlave: RTCPeerSlave | undefined;

    firestoreService: FireStoreService;
    userService: UserService;
    private localPlayer: LocalPlayerData;
    private obsUserId: string | null;

    zone: NgZone;
    dataSubscription: Subscription;
    lobbySubscription: Subscription;

    constructor(lobby: Lobby, firestoreService: FireStoreService, userService: UserService, localUser: LocalPlayerData, zone: NgZone, obsUserId: string | null = null) {
        this.firestoreService = firestoreService;
        this.userService = userService;
        this.localPlayer = localUser;
        this.zone = zone;
        this.lobby = lobby;
        this.obsUserId = obsUserId;

        //create run if it doesn't exist
        if (!this.run) {
            console.log("Creating Run!");
            this.run = new Run(this.lobby.runData);

            //setup local user (this should be done here or at some point that isn't instant to give time to load in the user if a dev refresh happens while on run page)
            this.localPlayer.user = this.userService.user.getUserBase();
            this.localPlayer.mode = this.run.data.mode;
            this.run.spectators.push(new Player(this.localPlayer.user));
        }

        this.onLobbyChange(this.lobby);

    }


    async onLobbyChange(lobby: Lobby) {
        this.lobby = lobby;

        console.log("Got Lobby Change!");

        //kill current slave connection if new host
        if (this.localSlave?.hostId !== this.lobby.host?.id)
            this.resetUser();

        //become slave if not already and master exists
        if (!this.localSlave && this.lobby.host)
            this.setupSlave();
    }

    resetUser() {
        this.dataSubscription?.unsubscribe();

        if (this.localSlave) {
            this.localSlave.destroy();
            this.localSlave = undefined;
        }

        this.connected = false;
    }
    
    getUser(userId: string): Player | undefined {
        return this.run?.getPlayer(userId);
    }

    async setupSlave() {
        console.log("Setting up slave!");
        this.localSlave = new RTCPeerSlave(this.userService.user.getUserBase(), (await this.firestoreService.getLobbyDoc(this.lobby!.id)), this.lobby!.host!);
        this.dataSubscription = this.localSlave.eventChannel.subscribe(event => {
            this.onDataChannelEvent(event, false);
        });
    }

    sendEvent(type: EventType, value: any = null) {
        const event = new DataChannelEvent(this.userService.getId(), type, value);
        if (this.localSlave) {
            this.localSlave.peer.sendEvent(event);
            this.onDataChannelEvent(event, false); //to run on a potentially safer but slower mode disable this and send back the event from master/host
        }
    }

    onDataChannelEvent(event: DataChannelEvent, isMaster: boolean) {
        const userId = this.userService.getId();

        switch (event.type) {

            case EventType.Connect: //rtc stuff on connection is setup individually in rtc-peer-master/slave
                const newUser: UserBase = event.value as UserBase;
                if (event.userId === "host")
                    this.userService.sendNotification("Client to server fallback communication established,\n please recreate the lobby if peer to peer usually works.", 10000);
                
                console.log(newUser.name + " connected!");

                if (isMaster) {
                    //handle run
                    const isRunner: boolean = (this.run?.getPlayerTeam(newUser.id) !== undefined);
                    if (isRunner) 
                        this.sendEvent(EventType.Reconnect, newUser.id);
                    else if (!this.run?.hasSpectator(newUser.id))
                        this.run!.spectators.push(new Player(newUser));

                    //handle lobby
                    if (!this.lobby?.hasUser(newUser.id)) {
                        this.lobby?.addUser(new LobbyUser(newUser, isRunner));
                        this.updateFirestoreLobby();
                    }
                    else if ((this.lobby.hasRunner(newUser.id) && !isRunner) || (this.lobby.hasSpectator(newUser.id) && isRunner)) {
                        this.lobby!.getUser(newUser.id)!.isRunner = isRunner;
                        this.updateFirestoreLobby();
                    }
                }
                else if (event.userId === this.localPlayer.user.id) {
                    this.sendEvent(EventType.RequestRunSync);
                }
                else if (!this.run?.hasSpectator(newUser.id))
                    this.run!.spectators.push(new Player(newUser));
                break;


            case EventType.Disconnect:
                if(!this.lobby) return;
                const disconnectedUser: UserBase = event.value as UserBase;
                this.zone.run(() => {
                    this.run?.removePlayer(disconnectedUser.id);
                }); 

                //host logic
                if (isMaster) {
                    let updateDb = false;

                    if (this.lobby.hasUser(disconnectedUser.id) || this.lobby.runnerIds.includes(disconnectedUser.id)) {
                        this.lobby.removeUser(disconnectedUser.id);
                        updateDb = true;
                    }

                    if (updateDb)
                        this.updateFirestoreLobby();
                }
                //backupHost on host disconnect
                else if (event.value === this.lobby.host?.id && this.lobby.backupHost?.id === userId) {
                    this.lobby.host = null; //current user will pickup host role on the file change
                    this.updateFirestoreLobby();
                }
                break;


            case EventType.Kick:
                if(this.localPlayer.user.id === event.value.id && (this.lobby?.host?.id === event.userId || this.localPlayer.user.id === event.userId)) {
                    this.userService.sendNotification("You've been kicked from the lobby.");
                    this.userService.routeTo('/lobby');
                }
                else if (isMaster && event.value.id.startsWith("OBS-"))
                    this.sendEvent(EventType.Disconnect, event.value);
                break;


            case EventType.Reconnect:
                this.zone.run(() => {
                    this.run!.reconnectPlayer(event.value); 
                }); 
                break;
               
                
            case EventType.RequestRunSync:
                break;
            

            case EventType.RunSync:
                this.zone.run(() => { 

                    //update run
                    let run: Run = JSON.parse(JSON.stringify(event.value)); //to not cause referece so that import can run properly on the run after
                    this.run = Object.assign(new Run(run.data), run).reconstructRun();
                    
                    //update player and team
                    this.localPlayer.mode = this.run.data.mode;
                    let playerTeam = this.run?.getPlayerTeam(this.obsUserId ? this.obsUserId : this.localPlayer.user.id);
                    if (playerTeam) {
                        //clean out collectables so that potentially missed ones are given on import
                        if (!this.obsUserId)
                            playerTeam.tasks = [];

                        this.localPlayer.team = playerTeam;
                    }

                    this.run!.importTaskChanges(this.localPlayer, event.value);
                    this.connected = true;
                });
                break;



            case EventType.EndPlayerRun:  
                this.zone.run(() => { 
                    this.run?.endPlayerRun(event.userId, event.value);
                });
                break;


            case EventType.NewCell: 
                if (!this.run) return;
                this.zone.run(() => { 
                    this.run!.addSplit(event.value);
                });

                //handle none current user things
                if (event.userId !== userId) {
                    this.run.giveCellToUser(event.value, userId);
                    
                    if (this.run.getPlayerTeam(event.userId)?.id === this.localPlayer.team?.id || this.run.isMode(RunMode.Lockout)) {
                        //handle klaww kill
                        if ((event.value as Task).gameTask === "ogre-boss") {
                            this.localPlayer.killKlawwOnSpot = true;
                            this.localPlayer.checkKillKlaww();
                        }
                        //handle citadel elevator cell cases
                        else if ((event.value as Task).gameTask === "citadel-sage-green") {
                            this.localPlayer.checkCitadelSkip(this.run);
                            this.localPlayer.checkCitadelElevator();
                        }
                        else //check if orb buy
                            this.localPlayer.checkForFirstOrbCellFromMultiSeller((event.value as Task).gameTask);
                    }
                }

                //handle Lockout
                if (this.run.isMode(RunMode.Lockout)) {
                    const playerTeam = this.run.getPlayerTeam(this.localPlayer.user.id);
                    if (!playerTeam) break;
                    if (this.run.teams.length !== 1) {
                        if (this.localPlayer.gameState.cellCount < 73 || this.run.teams.some(team => team.id !== playerTeam.id && team.cellCount > playerTeam.cellCount))
                            OG.removeFinalBossAccess(this.localPlayer.gameState.currentLevel);
                        else
                            OG.giveFinalBossAccess(this.localPlayer.gameState.currentLevel);
                    }
                    //free for all Lockout
                    else {
                        const localPlayer = this.run.getPlayer(this.localPlayer.user.id)!;
                        if (this.localPlayer.gameState.cellCount < 73 || playerTeam.players.some(player => player.user.id !== localPlayer.user.id && player.cellsCollected > localPlayer.cellsCollected))
                            OG.removeFinalBossAccess(this.localPlayer.gameState.currentLevel);
                        else
                            OG.giveFinalBossAccess(this.localPlayer.gameState.currentLevel);
                    }
                }
                break;


            case EventType.NewPlayerState: 
                if (!this.run) return;
                this.zone.run(() => { 
                    this.run!.updateState(event.userId, event.value);
                });
                
                this.run.onUserStateChange(this.localPlayer, this.run.getPlayer(userId));
                if (event.userId !== userId)
                    this.localPlayer.checkForZoomerTalkSkip(event.value);
                break;


            case EventType.NewTaskStatusUpdate:
                if (!this.run) return;
                if (this.run.getPlayerTeam(event.userId)?.id === this.localPlayer.team?.id && !(this.run.isMode(RunMode.Lockout) && this.run.teams.length === 1))
                    this.localPlayer.updateTaskStatus(new Map(Object.entries(event.value)), event.userId === userId, false);
                else if (this.run.data.sharedWarpGatesBetweenTeams)
                    this.localPlayer.updateTaskStatus(new Map(Object.entries(event.value)), event.userId === userId, true);
                break;

                
            case EventType.ChangeTeam:
                this.zone.run(() => { 
                    this.run?.changeTeam(this.getUser(event.userId)?.user, event.value);

                    //check set team for obs window, set from run component if normal user
                    if (this.obsUserId && this.obsUserId === event.userId) { 
                        this.localPlayer.team = this.run?.getPlayerTeam(this.obsUserId);
                    }
                });

                if (!isMaster) break;
                const user: LobbyUser | undefined = this.lobby?.getUser(event.userId);
                if (!user || user.isRunner) break;

                user.isRunner = true;
                if (!this.lobby!.runnerIds.includes(user.id))
                    this.lobby!.runnerIds.push(user.id);
                this.updateFirestoreLobby();
                break;

            
            case EventType.ChangeTeamName:
                let team = this.run?.getPlayerTeam(event.userId);
                if (!team) return;
                this.zone.run(() => { 
                    team!.name = event.value;
                });
                break;


            case EventType.Ready:
                this.zone.run(() => { 
                    this.run!.toggleReady(event.userId, event.value); 
                });  
                
                //check if everyone is ready, send start call if so
                if (isMaster && event.value === PlayerState.Ready && this.run!.everyoneIsReady()) {
                    this.lobby!.visible = false;
                    this.updateFirestoreLobby();
                    
                    this.sendEvent(EventType.StartRun, new Date().toUTCString());
                }     
                break;
            

            case EventType.StartRun:
                this.zone.run(() => { 
                    this.run!.start(new Date());
                    this.run!.setOrbCosts(this.localPlayer.user.id);
                    this.getPlayerState();
                });  
                //!TODO: could be done in some more elegant way
                setTimeout(() => {
                    this.localPlayer.resetRunDependentProperties();
                }, this.run!.timer.countdownSeconds * 1000)
                break;


            case EventType.ToggleReset:
                this.zone.run(() => { 
                    if (this.run!.toggleVoteReset(event.userId, event.value)) {
                        OG.runCommand("(send-event *target* 'loading)");
                        this.localPlayer.state = PlayerState.Neutral;
                    }
                });  
                break;


            default:
                console.log("MISSING EVENT TYPE IMPLEMENTATION!");
        }
    }

    async updateFirestoreLobby() {
        if (!this.lobby || !(this.lobby?.backupHost?.id === this.localPlayer.user.id || this.lobby?.host?.id === this.localPlayer.user.id || this.lobby?.host === null)) return;
        this.lobby.lastUpdateDate = new Date().toUTCString();
        await this.firestoreService.updateLobby(this.lobby);
    }

    getPlayerState(): void {
        if ((window as any).electron)
            (window as any).electron.send('og-state-read');
    }



    destroy() {
        this.isBeingDestroyed = true;

        this.resetUser();
        this.lobbySubscription?.unsubscribe();

        if (this.lobby && this.lobby?.host === null) { //host removes user from lobby otherwise but host has to the job for himself
            this.lobby.removeUser(this.localPlayer.user.id);
            this.updateFirestoreLobby();
        }
    }
}