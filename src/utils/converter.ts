/* eslint-disable no-process-exit */
/**
 * Script to convert old json format into new database
 * Usage:
 *     ts-node converter.ts <path_to_json>
 */

import Database from "../components/app/services/database.service";
import FileSystem from "fs";
import Utils, { LogType } from "../components/common/utils.class";
import User from "../components/app/models/user.class";

convert(process.argv[2]);

/**
 * Converts JSON session data to database
 * @param filePath JSON file path
 */
async function convert(filePath: string): Promise<void> {
	//Check existance
	if (!filePath) {
		Utils.log(
			"Usage:\r\rts-node converter.ts <path_to_json>",
			LogType.WARNING
		);
		return;
	}
	Utils.log("Running convertion script...");
	Utils.log("Initializing database module...");
	await Database.initialize();
	Utils.log("Loading json file...");
	if (!FileSystem.existsSync(filePath)) {
		Utils.log("Json file not found!", LogType.ERROR);
		return;
	}

	const json = FileSystem.readFileSync(filePath, "utf-8");
	Utils.log("Parsing JSON....");
	const data = JSON.parse(json);

	Utils.log("Loading complete!", LogType.OK);
	Utils.log("Processing Users", LogType.DIVIDER);
	//Loop though all sessions
	for (const userId of Object.keys(data)) {
		const sessions = data[userId].sessions;
		const user = new User(userId, data[userId].name);
		Utils.log(`Converting: ${user.name}...`);

		Database.createUser(user);
		for (const session of sessions) {
			//Validate session
			if (
				session.platform == null ||
				!Number.isInteger(+session.from) ||
				!Number.isInteger(+session.to)
			) {
				continue;
			}

			const sessionData = {
				userId: userId,
				platform: +session.platform,
				from: new Date(+session.from * 1000),
				to: new Date(+session.to * 1000)
			};

			//Check negative time
			if (+sessionData.from >= +sessionData.to) {
				sessionData.to = new Date(+sessionData.from + 5000);
			}

			Database.addSession(sessionData);
		}
	}

	//Close everything
	Utils.log("Waiting for all database queries...");
	await Database.close();
	Utils.log("Convertion completed!", LogType.OK);
}
