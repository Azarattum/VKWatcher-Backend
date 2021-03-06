import Express from "express";
import Compression from "compression";
import Cors from "cors";
import Service from "../../common/service.abstract";
import Database from "./database.service";
import Http from "http";
import Https from "https";
import FileSystem from "fs";

/**
 * Web server service
 */
export default class Server extends Service<"">() {
	private static httpServer: Http.Server | null = null;
	private static httpsServer: Https.Server | null = null;

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

		this.httpServer = Http.createServer(express).listen(80);

		//Also try to run https server
		if (
			FileSystem.existsSync("privkey.pem") &&
			FileSystem.existsSync("fullchain.pem")
		) {
			const privateKey = FileSystem.readFileSync("privkey.pem", "utf8");
			const certificate = FileSystem.readFileSync(
				"fullchain.pem",
				"utf8"
			);
			const credentials = { key: privateKey, cert: certificate };
			this.httpsServer = Https.createServer(credentials, express).listen(
				443
			);
		}
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
			"/api/sessions/get/:userId/:offset?/:count?",
			async (request, response) => {
				const params = request.params;
				const sessions = await Database.getSessions(
					params.userId,
					Number.isInteger(+params.offset)
						? +params.offset
						: undefined,
					Number.isInteger(+params.count) ? +params.count : undefined
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
		if (this.httpServer) {
			this.httpServer.close();
		}
		if (this.httpsServer) {
			this.httpsServer.close();
		}
	}
}
