import Service from "../../common/service.abstract";
import Api from "./api.class";
import User, { ActionType } from "../models/user.class";

/**
 * Service to watch all users
 */
export default class Watcher extends Service<
	"loggedin" | "loggedout" | "created"
>() {
	private static api: Api | null = null;
	private static users: User[] | null = null;
	private static timer: NodeJS.Timeout | null = null;

	public static async initialize(
		api: Api,
		timeout: number = 30000
	): Promise<void> {
		this.api = api;
		this.users = [];

		const callback = this.watch.bind(this);
		this.timer = setInterval(callback, timeout);
		setTimeout(callback, 10);
	}

	/**
	 * Interval callback that watches changes in users
	 */
	private static async watch(): Promise<void> {
		if (!this.api || !this.users) return;

		const users = await this.api.getFrieds();
		const actions = User.compareUsers(this.users, users);

		//Call events
		for (const action of actions) {
			switch (action.type) {
				case ActionType.CREATED:
					this.call("created", action.user);
					break;
				case ActionType.LOGGED_IN:
					this.call("loggedin", action.user);
					break;
				case ActionType.LOGGED_OUT:
					this.call("loggedout", action.user);
					break;

				default:
					break;
			}
		}

		this.users = users;
	}
}
