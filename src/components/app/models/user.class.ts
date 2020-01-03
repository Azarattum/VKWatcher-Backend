/**
 * Represents user
 */
export default class User {
	public id: string;
	public name: string;
	public online: boolean;
	public details: IDetails;

	public constructor(
		id: string,
		name: string,
		online: boolean = false,
		details: IDetails = {
			lastSeen: new Date(),
			platform: 0
		}
	) {
		this.id = id;
		this.name = name;
		this.online = online;
		this.details = details;
	}

	/**
	 * Compares the user to its updated version and
	 * return the action that this user did
	 * @param user Updated version of THE SAME user
	 */
	public compare(user: User): Action {
		///Might be chaged for future functionality
		if (user.id != this.id) {
			throw new Error("Cannot compare different users.");
		}

		if (!this.online && user.online) {
			return new Action(user, ActionType.LOGGED_IN);
		} else if (this.online && !user.online) {
			return new Action(user, ActionType.LOGGED_OUT);
		}

		return new Action(user, ActionType.UNCHANGED);
	}

	/**
	 * Updates online status in provided users array
	 * using an array of online user's ids
	 * @param users An array of users
	 */
	public static compareUsers(users: User[], updatedUsers: User[]): Action[] {
		const actions: Action[] = [];

		//Compare current users
		for (const user of users) {
			const updated = updatedUsers.find(x => x.id == user.id);
			if (updated) {
				const action = user.compare(updated);
				if (action.type != ActionType.UNCHANGED) {
					actions.push(action);
				}
			} else {
				actions.push(new Action(user, ActionType.LOGGED_OUT));
			}
		}

		//Find new users
		for (const user of updatedUsers) {
			const old = users.find(x => x.id == user.id);
			if (!old && user.online) {
				actions.push(new Action(user, ActionType.LOGGED_IN));
			}
		}

		return actions;
	}
}

/**
 * The interface for user log out details
 */
export interface IDetails {
	lastSeen: Date;
	platform: number;
}

/**
 * Represents user log(in/out) action
 */
export class Action {
	public readonly user: User;
	public readonly type: ActionType;

	public constructor(user: User, type: ActionType) {
		this.user = user;
		this.type = type;
	}
}

/**
 * User log action type
 */
export enum ActionType {
	UNCHANGED,
	LOGGED_IN,
	LOGGED_OUT
}
