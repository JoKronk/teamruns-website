import { CategoryOption } from "../run/category";
import { DbLeaderboardPb } from "./db-leaderboard-pb";
import { DbPlayer } from "./db-player";
import { DbTeam } from "./db-team";

export class DbPb extends DbLeaderboardPb {
    category: CategoryOption;
    sameLevel: boolean;
    override userIds: Map<string, boolean> | any = new Map();
    cellCount: number;
    playerCount: number;
    players: DbPlayer[] = [];
    wasRace: boolean;
    wasWr: boolean;
    playback: any;

    runId?: string;

}