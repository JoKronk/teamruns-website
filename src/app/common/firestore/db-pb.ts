import { CategoryOption } from "../run/category";
import { RunData } from "../run/run-data";
import { Timer } from "../run/timer";
import { DbLeaderboardPb, UserDisplayContent } from "./db-leaderboard-pb";
import { DbPlayer } from "./db-player";
import { DbRun } from "./db-run";
import { DbTeam } from "./db-team";
import { DbUsersCollection } from "./db-users-collection";

export class DbPb extends DbLeaderboardPb {
    runId: string;
    category: CategoryOption;
    sameLevel: boolean;
    override userIds: Map<string, boolean> | any = new Map(); //this bool structure is required to be able to query users from firestore db
    cellCount: number;
    playerCount: number;
    players: DbPlayer[] = [];
    wasRace: boolean;
    wasWr: boolean;
    lbPositionWhenSet: number;
    isCurrentPb: boolean;


    //frontend values
    timeSinceFrontend: number | undefined;
    daysSinceFrontend: boolean | undefined;
    lbPositionWhenSetFrontend: string | undefined;

    static convertToFromRun(run: DbRun, team: DbTeam, isWr: boolean): DbPb {
        let pb = new DbPb();

        pb.version = run.data.buildVersion;
        pb.gameVersion = run.data.gameVersion;
        pb.date = run.date;
        pb.tasks = team.tasks;
        pb.endTimeMs = team.endTimeMs;
        pb.playbackAvailable = true;

        pb.id = crypto.randomUUID(); //id can't be same as runId since there might be multiple teams pbing which would create duplicates
        pb.runId = run.id ?? "";
        pb.category = run.data.category;
        pb.sameLevel = run.data.sameLevel;
        pb.userIds = DbPb.convertUserIds(team.players.flatMap(x => x.user.id));
        pb.playerCount = team.players.length;
        pb.cellCount = team.cellCount;
        pb.players = team.players;
        pb.wasRace = run.teams.length !== 0;
        pb.wasWr = isWr;
        return pb;
    }

    override clearFrontendValues(): void {
        this.id = undefined;
        this.dateFrontend = undefined;
        this.endTimeFrontend = undefined;
        this.userDisplayContent = undefined;
        this.hasLocalUser = undefined;
        this.timeSinceFrontend = undefined;
        this.daysSinceFrontend = undefined;
        this.lbPositionWhenSetFrontend = undefined;
    }

    override fillFrontendValues(usersCollection: DbUsersCollection) {
        
        let pbUserIds = (this.userIds instanceof Map) ? Array.from(this.userIds.keys()) : Array.from(new Map(Object.entries(this.userIds)).keys());
        this.endTimeFrontend = this.endTimeMs === 0 ? "DNF" : Timer.msToTextFormat(this.endTimeMs);
        this.timeSinceFrontend = Math.round((new Date().getTime() - this.date) / (1000 * 60 * 60));
        this.daysSinceFrontend = this.timeSinceFrontend > 24;
        if (this.daysSinceFrontend)
            this.timeSinceFrontend = Math.round(this.timeSinceFrontend / 24) + 1;

        this.lbPositionWhenSetFrontend = DbPb.placementNumberToString(this.lbPositionWhenSet + 1);

        if (this.date)
            this.dateFrontend = new Date(this.date);
        
            pbUserIds.forEach((id) => {
            let username = usersCollection?.users.find(x => x.id === id)?.name ?? "Unknown";
            let content = this.userContent.find(x => x.userId === id) as UserDisplayContent;
            if (content && content.userId)
                content.name = username;
            else
                content = new UserDisplayContent(id, username);

            if (!this.userDisplayContent)
                this.userDisplayContent = [];
            this.userDisplayContent.push(content);
        });
        if (!this.userDisplayContent)
            this.userDisplayContent = [];
        this.userDisplayContent.sort((a, b) => a.name.localeCompare(b.name));

        return this;
    }

    static convertUserIds(userIds: string[]): Map<string, boolean> {
        let userIdsConverted: Map<string, boolean> = new Map();
        for (let id of userIds)
            userIdsConverted.set(id, true);
        return userIdsConverted;
    }

    static placementNumberToString(placement: number) {
        let j = placement % 10;
        let k = placement % 100;
        if (j === 1 && k !== 11) {
            return placement + "st";
        }
        if (j === 2 && k !== 12) {
            return placement + "nd";
        }
        if (j === 3 && k !== 13) {
            return placement + "rd";
        }
        return placement + "th";
    }

}