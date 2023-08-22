import { DbUser } from "../firestore/db-user";

export class UserBase {
    id: string;
    name: string;

    constructor(id: string, name: string) {
        this.id =  id;
        this.name = name;
    }

    getUserBase(): UserBase {
        return new UserBase(this.id, this.name);
    }
}


export class User extends UserBase {
    ogFolderpath: string = "";
    darkMode: boolean = true;
    displayName: string;

    constructor() {
        super(crypto.randomUUID(), "");
        this.ogFolderpath = "";
        this.darkMode = true;
    }

    getCopy(): User {
        return JSON.parse(JSON.stringify(this));
    }

    isEqualToDataCopy(copy: User) : boolean {
        return this.name === copy.name &&
            this.displayName === copy.displayName &&
            this.ogFolderpath === copy.ogFolderpath &&
            this.darkMode === copy.darkMode;
    }
}