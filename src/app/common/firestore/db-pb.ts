import { CategoryOption } from "../run/category";
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

    //frontend values
    timeSinceFrontend: number | undefined;
    daysSinceFrontend: boolean | undefined;

    static convertToFromRun(run: DbRun, team: DbTeam, isWr: boolean): DbPb {
        let pb = new DbPb();

        pb.version = run.data.buildVersion;
        pb.date = run.date;
        pb.tasks = team.tasks;
        pb.endTimeMs = team.endTimeMs;
        pb.playbackAvailable = true;

        pb.id = crypto.randomUUID(); //id can't be same as runId since there might be multiple teams pbing which would create duplicates
        pb.runId = run.id ?? "";
        pb.category = run.data.category;
        pb.sameLevel = run.data.requireSameLevel;
        team.players.forEach(x => {
            pb.userIds.set(x.user.id, true);
        });
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
    }

    override fillFrontendValues(usersCollection: DbUsersCollection) {
        
        let pbUserIds = (this.userIds instanceof Map) ? Array.from(this.userIds.keys()) : Array.from(new Map(Object.entries(this.userIds)).keys());
        this.endTimeFrontend = this.endTimeMs === 0 ? "DNF" : Timer.msToTextFormat(this.endTimeMs);
        this.timeSinceFrontend = Math.round((new Date().getTime() - this.date) / (1000 * 60 * 60));
        this.daysSinceFrontend = this.timeSinceFrontend > 24;
        if (this.daysSinceFrontend)
            this.timeSinceFrontend = Math.round(this.timeSinceFrontend / 24) + 1;

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

}