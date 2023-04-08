import { Injectable } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { AngularFirestore, AngularFirestoreCollection } from '@angular/fire/compat/firestore';
import { environment } from 'src/environments/environment';
import { CollectionName } from '../common/firestore/collection-name';
import { Lobby } from '../common/firestore/lobby';
import { Preset } from '../common/firestore/preset';
import { DataChannelEvent } from '../common/peer/data-channel-event';
import { RTCPeer } from '../common/peer/rtc-peer';
import { Run } from '../common/run/run';

@Injectable({
  providedIn: 'root'
})
export class FireStoreService {

  private runs: AngularFirestoreCollection<Run>;
  private lobbies: AngularFirestoreCollection<Lobby>;
  private isAuthenticated: boolean = false;

  constructor(public firestore: AngularFirestore, public auth: AngularFireAuth) {
    this.runs = firestore.collection<Run>(CollectionName.runs);
    this.lobbies = firestore.collection<Lobby>(CollectionName.lobbies);
  }

  private async checkAuthenticated() {
    if (this.isAuthenticated) return;
    await this.auth.signInWithEmailAndPassword(environment.firestoreUsername, environment.firestorePassword)
    this.isAuthenticated = true;
    return;
  }

  async getUserLobby(userId: string) {
    await this.checkAuthenticated();
    return this.firestore.collection<Lobby>(CollectionName.lobbies, ref => ref.where('runnerIds', 'array-contains', userId)).valueChanges();
  }

  async getLobbyDoc(id: string) {
    await this.checkAuthenticated();
    return this.firestore.collection<Lobby>(CollectionName.lobbies).doc(id);
  }

  async addLobby(lobby: Lobby) {
    await this.checkAuthenticated();
    await this.lobbies.doc<Lobby>(lobby.id).set(JSON.parse(JSON.stringify(lobby)));
  }

  async updateLobby(lobby: Lobby) {
    await this.checkAuthenticated();
    await this.addLobby(lobby); //they happen to be the same command, just trying to avoid confusion when looking for an update method
  }
}
