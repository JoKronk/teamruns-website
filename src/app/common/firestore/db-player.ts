import { Player } from "../player/player";
import { UserBase } from "../user/user";

export class DbPlayer {
    user: UserBase;
    cellsCollected: number = 0;

    currentUsernameFrontend?: string;

    constructor(player: Player) {
        this.user = player.user;
        this.cellsCollected = player.cellsCollected;
    }
}