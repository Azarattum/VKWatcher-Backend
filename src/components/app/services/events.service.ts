import Service from "../../common/service.abstract";
import Watcher from "./watcher.service";
import User from "../models/user.class";
import Utils from "../../common/utils.class";
import Database from "./database.service";
import Sessions, { ISession } from "./sessions.service";

/**
 * One service to rule them all!
 * Registers and manages event-driven communication
 * among all services
 */
export default class Envets extends Service<"registered">() {
	public static async initialize(): Promise<void> {
		//Register service events
		this.registerWatcher();
		this.registerSessions();

		this.call("registered");
	}

	/**
	 * Register Watcher service events
	 */
	private static registerWatcher(): void {
		Watcher.addEventListener("loggedin", (user: User) => {
			Utils.log(
				"\x1b[1m" + user.name + "\x1b[0m back \x1b[94monline\x1b[0m."
			);
			Sessions.registerLogIn(user);
		});

		Watcher.addEventListener("loggedout", (user: User) => {
			Utils.log(
				"\x1b[1m" + user.name + "\x1b[0m left \x1b[33moffline\x1b[0m."
			);
			Sessions.registerLogOut(user);
		});

		Watcher.addEventListener("created", (user: User) => {
			Database.createUser(user);
		});
	}

	/**
	 * Register Sessions service events
	 */
	private static registerSessions(): void {
		Sessions.addEventListener("sessionfound", (session: ISession) => {
			Database.addSession(session);
		});
	}
}
