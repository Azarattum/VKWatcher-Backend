import HTTP from "http";
import Express from "express";
import BodyParser from "body-parser";
import Service from "../../common/service.abstract";
import Database from "./database.service";

/**
 * Web server service
 */
export default class Server extends Service<"">() {
	private static server: HTTP.Server | null = null;

	public static async initialize(): Promise<void> {
		const express = Express();
		express.use(Express.static("public"));
		express.use(BodyParser.json());
		express.use(
			BodyParser.urlencoded({
				extended: true
			})
		);
		this.initRoutes(express);

		this.server = express.listen(80);
	}

	private static initRoutes(express: Express.Application): void {
		//Get users
		express.get("/api/users/get/:id", async (request, response) => {
			const users = await Database.getUsers(request.params.id);
			response.send(users.length == 1 ? users[0] : users);
		});

		//Get names
		express.get("/api/users/name/:id", async (request, response) => {
			const names = await Database.getNames(request.params.id);
			response.send(names.length == 1 ? names[0] : names);
		});

		//Get days
		express.get("/api/users/days/:id", async (request, response) => {
			const days = await Database.getDays(request.params.id);
			response.send(days.length == 1 ? days[0] : days);
		});

		//Get sessions
		express.get(
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
