import { DbTask } from "../firestore/db-task";

export class Task {
    gameTask: string;
    isCollectedCell: boolean;
    obtainedByName: string;
    obtainedById: string;
    obtainedAt: string;

    constructor() {
    }

    public static fromDbTask(task: DbTask): Task {
        return {
            gameTask: task.gameTask,
            isCollectedCell: task.isCell,
            obtainedByName: task.obtainedByName,
            obtainedById: task.obtainedById,
            obtainedAt: task.obtainedAt
        };
    }

    public static lastboss = "finalboss-movies";
    public static forfeit = "finalboss-forfeit";

    public static resultsInCell(gameTask: string) {
        return ([
            "jungle-eggtop",
            "jungle-lurkerm",
            "jungle-tower",
            "jungle-fishgame",
            "jungle-plant",
            "jungle-buzzer",
            "jungle-canyon-end",
            "jungle-temple-door",
            "village1-yakow",
            "village1-mayor-money",
            "village1-uncle-money",
            "village1-oracle-money1",
            "village1-oracle-money2",
            "beach-ecorocks",
            "beach-pelican",
            "beach-flutflut",
            "beach-seagull",
            "beach-cannon",
            "beach-buzzer",
            "beach-gimmie",
            "beach-sentinel",
            "misty-muse",
            "misty-boat",
            "misty-warehouse",
            "misty-cannon",
            "misty-bike",
            "misty-buzzer",
            "misty-bike-jump",
            "misty-eco-challenge",
            "village2-gambler-money",
            "village2-geologist-money",
            "village2-warrior-money",
            "village2-oracle-money1",
            "village2-oracle-money2",
            "swamp-billy",
            "swamp-flutflut",
            "swamp-battle",
            "swamp-tether-1",
            "swamp-tether-2",
            "swamp-tether-3",
            "swamp-tether-4",
            "swamp-buzzer",
            "sunken-platforms",
            "sunken-pipe",
            "sunken-slide",
            "sunken-room",
            "sunken-sharks",
            "sunken-buzzer",
            "sunken-top-of-helix",
            "sunken-spinning-room",
            "rolling-race",
            "rolling-robbers",
            "rolling-moles",
            "rolling-plants",
            "rolling-lake",
            "rolling-buzzer",
            "rolling-ring-chase-1",
            "rolling-ring-chase-2",
            "snow-eggtop",
            "snow-ram",
            "snow-fort",
            "snow-ball",
            "snow-bunnies",
            "snow-buzzer",
            "snow-bumpers",
            "snow-cage",
            "firecanyon-buzzer",
            "firecanyon-end",
            "citadel-sage-green",
            "citadel-sage-blue",
            "citadel-sage-red",
            "citadel-sage-yellow",
            "village3-extra1",
            "village1-buzzer",
            "village2-buzzer",
            "village3-buzzer",
            "cave-gnawers",
            "cave-dark-crystals",
            "cave-dark-climb",
            "cave-robot-climb",
            "cave-swing-poles",
            "cave-spider-tunnel",
            "cave-platforms",
            "cave-buzzer",
            "ogre-boss",
            "ogre-end",
            "ogre-buzzer",
            "lavatube-end",
            "lavatube-buzzer",
            "citadel-buzzer",
            "training-gimmie",
            "training-door",
            "training-climb",
            "training-buzzer",
            "village3-miner-money1",
            "village3-miner-money2",
            "village3-miner-money3",
            "village3-miner-money4",
            "village3-oracle-money1",
            "village3-oracle-money2",
            "ogre-secret"
        ]).includes(gameTask);
    }


    public static isCellWithCost(gameTask: string) {
        return ([
            "village1-mayor-money",
            "village1-uncle-money",
            "village1-oracle-money1",
            "village1-oracle-money2",
            "village2-gambler-money",
            "village2-geologist-money",
            "village2-warrior-money",
            "village2-oracle-money1",
            "village2-oracle-money2",
            "village3-miner-money1",
            "village3-miner-money2",
            "village3-miner-money3",
            "village3-miner-money4",
            "village3-oracle-money1",
            "village3-oracle-money2"
        ]).includes(gameTask);
    }
}