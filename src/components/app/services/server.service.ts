import HTTP from "http";
import Express from "express";
import Compression from "compression";
import Cors from "cors";
import Service from "../../common/service.abstract";
import Database from "./database.service";

/**
 * Web server service
 */
export default class Server extends Service<"">() {
	private static server: HTTP.Server | null = null;

	/**
	 * Initializes API and static server
	 */
	public static async initialize(): Promise<void> {
		const express = Express();
		express.use(Cors());
		express.use(Compression());
		express.use(Express.static("public"));
		express.use(Express.json());
		express.use(this.getRouter());

		this.server = express.listen(80);
	}

	/**
	 * Initializes API routes
	 * @param express Express application object
	 */
	private static getRouter(): Express.IRouter {
		const router = Express.Router();

		//Get users
		router.get("/api/users/get/:id", async (request, response) => {
			const users = await Database.getUsers(request.params.id);
			response.send(users.length == 1 ? users[0] : users);
		});

		//Get names
		router.get("/api/users/name/:id", async (request, response) => {
			const names = await Database.getNames(request.params.id);
			response.send(names.length == 1 ? names[0] : names);
		});

		//Get days
		router.get("/api/users/days/:id", async (request, response) => {
			const days = await Database.getDays(request.params.id);
			response.send(days.length == 1 ? days[0] : days);
		});

		//Get sessions
		router.get(
			"/api/sessions/get/:userId/:count?/:offset?",
			async (request, response) => {
				const params = request.params;
				const sessions = await Database.getSessions(
					params.userId,
					Number.isInteger(+params.count) ? +params.count : undefined,
					Number.isInteger(+params.offset)
						? +params.offset
						: undefined
				);
				response.send(sessions.length == 1 ? sessions[0] : sessions);
			}
		);

		//Get map
		router.get("/api/sessions/map/:offset?", async (request, response) => {
			const map = await Database.getMap(
				Number.isInteger(+request.params.offset)
					? +request.params.offset
					: undefined
			);

			response.send(map);
		});

		return router;
	}

	/**
	 * Stops the server and closes the service
	 */
	public static close(): void {
		super.close();
		if (!this.server) return;

		this.server.close();
	}
}
