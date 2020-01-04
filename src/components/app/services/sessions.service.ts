import Service from "../../common/service.abstract";
import User from "../models/user.class";

/**
 * Service to work with the database
 */
export default class Sessions extends Service<"sessionfound">() {
	private static sessions: { [userId: string]: ISession | null };

	public static async initialize(): Promise<void> {
		this.sessions = {};
	}

	/**
	 * Register user's login to its session
	 * @param user User that logged in
	 */
	public static registerLogIn(user: User): void {
		if (!this.sessions[user.id]) {
			this.sessions[user.id] = {
				userId: user.id,
				platform: user.details.platform,
				from: user.details.lastSeen,
				to: null
			};
		}
	}

	/**
	 * Register user's logout to its session
	 * @param user User that logged in
	 */
	public static registerLogOut(user: User): void {
		const session = this.sessions[user.id];
		if (!session) return;

		session.to = user.details.lastSeen;
		session.platform = user.details.platform;

		//Assume 5sec session if user logged out instantly
		if (+session.from >= +session.to) {
			session.to = new Date(+session.from + 5000);
		}

		this.call("sessionfound", session);

		this.sessions[user.id] = null;
	}

	/**
	 * Close all sessions and emit leftover events
	 */
	public static close(): void {
		super.close();
		const now = new Date();

		for (const session of Object.values(this.sessions)) {
			if (!session) continue;

			//If session is longer than 5min
			if (+now - +session.from > 300000) {
				//Close session with current time
				session.to = now;
				this.call("sessionfound", session);
				this.sessions[session.userId] = null;
			}
		}
	}
}

export interface ISession {
	userId: string;
	platform: number;
	from: Date;
	to: Date | null;
}
