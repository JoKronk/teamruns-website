import { Injectable } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { AngularFirestore, AngularFirestoreCollection } from '@angular/fire/compat/firestore';
import { environment } from 'src/environments/environment';
import { CollectionName } from '../common/firestore/collection-name';
import { DbLeaderboard } from '../common/firestore/db-leaderboard';
import { DbPb } from '../common/firestore/db-pb';
import { DbUsersCollection } from '../common/firestore/db-users-collection';
import { Lobby } from '../common/firestore/lobby';
import { Preset } from '../common/firestore/preset';
import { DataChannelEvent } from '../common/peer/data-channel-event';
import { RTCPeer } from '../common/peer/rtc-peer';
import { CategoryOption } from '../common/run/category';
import { Run } from '../common/run/run';

@Injectable({
  providedIn: 'root'
})
export class FireStoreService {

  private globalData: AngularFirestoreCollection<DbUsersCollection>;
  private lobbies: AngularFirestoreCollection<Lobby>;
  private isAuthenticated: boolean = false;

  constructor(public firestore: AngularFirestore, public auth: AngularFireAuth) {
    this.globalData = firestore.collection<DbUsersCollection>(CollectionName.globalData);
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

  async getUsers() {
    this.checkAuthenticated();
    return (await this.globalData.doc("users").ref.get()).data();
  }

  async getLobbyDoc(id: string) {
    await this.checkAuthenticated();
    return this.firestore.collection<Lobby>(CollectionName.lobbies).doc(id);
  }

  getLeaderboard(category: CategoryOption, sameLevel: boolean, players: number) {
    this.checkAuthenticated();
    return this.firestore.collection<DbLeaderboard>(CollectionName.leaderboards, ref => ref.where('category', '==', category).where('sameLevel', '==', sameLevel).where('players', '==', players)).valueChanges({idField: 'id'});
  }

  getWrs(category: CategoryOption, sameLevel: boolean, playerCount: number) {
    this.checkAuthenticated();
    return this.firestore.collection<DbPb>(CollectionName.personalBests, ref => ref.where('category', '==', category).where('sameLevel', '==', sameLevel).where('playerCount', '==', playerCount).where('wasWr', '==', true)).valueChanges({idField: 'id'});
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
