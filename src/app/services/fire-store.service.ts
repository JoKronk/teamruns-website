import { Injectable } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { AngularFirestore, AngularFirestoreCollection } from '@angular/fire/compat/firestore';
import { environment } from 'src/environments/environment';
import { CollectionName } from '../common/firestore/collection-name';
import { DbLeaderboard } from '../common/firestore/db-leaderboard';
import { DbPb } from '../common/firestore/db-pb';
import { DbUsersCollection } from '../common/firestore/db-users-collection';
import { CategoryOption } from '../common/run/category';

@Injectable({
  providedIn: 'root'
})

export class FireStoreService {

  private globalData: AngularFirestoreCollection<DbUsersCollection>;
  private isAuthenticated: boolean = false;

  constructor(public firestore: AngularFirestore, public auth: AngularFireAuth) {
    this.globalData = firestore.collection<DbUsersCollection>(CollectionName.globalData);
    this.checkAuthenticated();
  }

  private async checkAuthenticated() {
    if (this.isAuthenticated) return;
    await this.auth.signInWithEmailAndPassword(environment.firestoreUsername, environment.firestorePassword)
    this.isAuthenticated = true;
    return;
  }

  async getUsers() {
    await this.checkAuthenticated();
    return (await this.globalData.doc("users").ref.get()).data();
  }

  getLeaderboard(category: CategoryOption, sameLevel: boolean, players: number) {
    this.checkAuthenticated();
    return this.firestore.collection<DbLeaderboard>(CollectionName.leaderboards, ref => ref.where('category', '==', category).where('sameLevel', '==', sameLevel).where('players', '==', players)).valueChanges({idField: 'id'});
  }

  getWrs(category: CategoryOption, sameLevel: boolean, playerCount: number) {
    this.checkAuthenticated();
    return this.firestore.collection<DbPb>(CollectionName.personalBests, ref => ref.where('category', '==', category).where('sameLevel', '==', sameLevel).where('playerCount', '==', playerCount).where('wasWr', '==', true)).valueChanges({idField: 'id'});
  }

  getRecentPbs(amount: number) {
    this.checkAuthenticated();
    return this.firestore.collection<DbPb>(CollectionName.personalBests, ref => ref.orderBy('date', 'desc').limit(amount)).valueChanges({idField: 'id'});
  }
}