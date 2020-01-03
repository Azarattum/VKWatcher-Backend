import Service from "../../common/service.abstract";
import Watcher from "./watcher.service";
import User from "../models/user.class";
import Utils from "../../common/utils.class";

/**
 * One service to rule them all!
 * Registers and manages event-driven communication
 * among all services
 */
export default class Envets extends Service<"registered">() {
	public static async initialize(): Promise<void> {
		//Register service events
		this.registerWatcher();

		this.call("registered");
	}

	private static registerWatcher(): void {
		Watcher.addEventListener("loggedin", (user: User) => {
			Utils.log(`${user.name} logged in.`);
		});

		Watcher.addEventListener("loggedout", (user: User) => {
			Utils.log(`${user.name} logged out.`);
		});
	}
}
