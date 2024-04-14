import { RunData } from "../run/run-data";
import { Timer } from "../run/timer";
import { DbTeam } from "./db-team";
import { DbUsersCollection } from "./db-users-collection";

export class DbRun {
    data: RunData;
    teams: DbTeam[] = [];
    userIds: Map<string, boolean> | any = new Map();
    date: number;

    id?: string;
    dateFrontend?: Date;
    endTimeFrontend?: string;

    constructor() {
        this.id = crypto.randomUUID();
    }

    userIdsToMap() {
        this.userIds = new Map(Object.entries(this.userIds));
    }

    fillFrontendValues(usersCollection: DbUsersCollection | undefined) {
        if (this.teams.length == 0 || !usersCollection) return;

        let lastTeamEndTime = this.teams.sort((a, b) => b.endTimeMs - a.endTimeMs)[0].endTimeMs;
        this.endTimeFrontend = lastTeamEndTime === 0 ? "DNF" : Timer.msToTextFormat(lastTeamEndTime);

        if (this.date)
            this.dateFrontend = new Date(this.date);

        this.teams.forEach((team, index) => {
            team.players.forEach((player, i) => {
                this.teams[index].players[i].currentUsernameFrontend = usersCollection?.users.find(x => x.id === player.user.id)?.name ?? player.user.name;
            });
        });

        return this;
    }

    clearFrontendValues() {
        this.endTimeFrontend = undefined;
        this.dateFrontend = undefined;
        this.teams.forEach((team, index) => {
            team.players.forEach((player, i) => {
                this.teams[index].players[i].currentUsernameFrontend = undefined;
            });
        });
    }
}