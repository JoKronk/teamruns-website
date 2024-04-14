import { CategoryOption } from "../run/category";
import { DbLeaderboardPb } from "./db-leaderboard-pb";

export class DbLeaderboard {
    category: CategoryOption;
    sameLevel: boolean;
    players: number;
    pbs: DbLeaderboardPb[];

    id?: string;

    constructor(category: CategoryOption, sameLevel: boolean, players: number) {
        this.category = category;
        this.sameLevel = sameLevel;
        this.players = players;
        this.pbs = [];
        this.id = crypto.randomUUID();
    }

    clearFrontendValues() {
        this.id = undefined;
        if (!this.pbs) return;

        this.pbs.forEach(pb => {
            if (!(pb instanceof DbLeaderboardPb))
                pb = Object.assign(new DbLeaderboardPb(), pb);
            
            pb.clearFrontendValues();
        });
    }
}