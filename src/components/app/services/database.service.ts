import Sqlite from "sqlite3";
import FileSystem from "fs";
import Service from "../../common/service.abstract";
import User from "../models/user.class";
import { ISession } from "./sessions.service";

/**
 * Service to work with the database
 */
export default class Database extends Service<"">() {
	private static database: Sqlite.Database;

	public static async initialize(): Promise<void> {
		//Create directory for data
		if (!FileSystem.existsSync("./data")) {
			FileSystem.mkdirSync("./data");
		}

		this.database = new Sqlite.Database("./data/sessions.db");
		this.database.parallelize(() => {
			//Create sessions table
			let sql = "CREATE TABLE IF NOT EXISTS sessions (";
			sql += "    user_id TEXT NOT NULL,";
			sql += "    platform INTEGER NOT NULL,";
			sql += "    time_from DATE NOT NULL,";
			sql += "    time_to DATE NOT NULL";
			sql += ");";
			this.database.run(sql);

			//Create users table
			sql = "CREATE TABLE IF NOT EXISTS users (";
			sql += "    id TEXT PRIMARY KEY,";
			sql += "    name TEXT NOT NULL";
			sql += ");";
			this.database.run(sql);
		});
	}

	/**
	 * Saves the creation of user into the database
	 * @param user User that was created
	 */
	public static async createUser(user: User): Promise<void> {
		//Insert new user into the table
		let sql = "INSERT INTO users (id, name) ";
		sql += "VALUES($id, $name) ";
		sql += "EXCEPT ";
		sql += "SELECT id, name FROM users";
		this.database.run(sql, { $id: user.id, $name: user.name });
	}

	/**
	 * Saves the new session into the database
	 * @param user User that was created
	 */
	public static async addSession(session: ISession): Promise<void> {
		//Insert new session into the table
		let sql =
			"INSERT INTO sessions (user_id, platform, time_from, time_to)";
		sql += "VALUES($userId, $platform, $from, $to)";

		this.database.run(sql, {
			$userId: session.userId,
			$platform: session.platform,
			$from: session.from,
			$to: session.to
		});
	}

	/**
	 * Safly stop and close the database
	 */
	public static close(): void {
		super.close();
		this.database.close();
	}
}
