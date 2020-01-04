import Sqlite from "sqlite3";
import FileSystem from "fs";
import Service from "../../common/service.abstract";
import User from "../models/user.class";
import { ISession } from "./sessions.service";

/**
 * Service to work with the database
 */
export default class Database extends Service<"">() {
	private static database: Sqlite.Database | null = null;

	public static async initialize(): Promise<void> {
		//Create directory for data
		if (!FileSystem.existsSync("./data")) {
			FileSystem.mkdirSync("./data");
		}

		this.database = new Sqlite.Database("./data/sessions.db");
		this.database.parallelize(() => {
			if (!this.database) return;

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
		if (!this.database) return;

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
		if (!this.database) return;
		if (!session.to) return;

		//Insert new session into the table
		let sql =
			"INSERT INTO sessions (user_id, platform, time_from, time_to)";
		sql += "VALUES($userId, $platform, $from, $to)";

		this.database.run(sql, {
			$userId: session.userId,
			$platform: session.platform,
			$from: session.from
				.toISOString()
				.slice(0, 19)
				.replace("T", " "),
			$to: session.to
				.toISOString()
				.slice(0, 19)
				.replace("T", " ")
		});
	}

	public static async getNames(id: string = "all"): Promise<IUserName[]> {
		return new Promise<IUserName[]>((resolve, reject) => {
			if (!this.database) {
				return reject(new Error("Database is not initialized!"));
			}

			this.database.all(
				"SELECT * FROM users WHERE id=$id or $id='all'",
				{ $id: id },
				(error, rows) => {
					if (error) {
						return reject(error);
					}

					return resolve(rows);
				}
			);
		});
	}

	public static async getDays(id: string = "all"): Promise<IUserName[]> {
		return new Promise<IUserName[]>((resolve, reject) => {
			if (!this.database) {
				return reject(new Error("Database is not initialized!"));
			}

			let sql = "SELECT";
			sql += "	id,";
			sql += "	ROUND((";
			sql += "		SELECT JULIANDAY(MAX(time_to)) FROM sessions";
			sql += "		WHERE user_id = id";
			sql += "	) -";
			sql += "	(";
			sql += "		SELECT JULIANDAY(MIN(time_from)) FROM sessions";
			sql += "		WHERE user_id = id";
			sql += "	) + 0.5) as days ";
			sql += "FROM users WHERE id = $id or $id='all'";

			this.database.all(sql, { $id: id }, (error, rows) => {
				if (error) {
					return reject(error);
				}

				return resolve(rows);
			});
		});
	}

	public static async getUsers(id: string = "all"): Promise<IUserName[]> {
		return new Promise<IUserName[]>((resolve, reject) => {
			if (!this.database) {
				return reject(new Error("Database is not initialized!"));
			}

			let sql = "SELECT";
			sql += "	id, name,";
			sql += "	ROUND((";
			sql += "		SELECT JULIANDAY(MAX(time_to)) FROM sessions";
			sql += "		WHERE user_id = id";
			sql += "	) -";
			sql += "	(";
			sql += "		SELECT JULIANDAY(MIN(time_from)) FROM sessions";
			sql += "		WHERE user_id = id";
			sql += "	) + 0.5) as days ";
			sql += "FROM users WHERE id = $id or $id='all'";

			this.database.all(sql, { $id: id }, (error, rows) => {
				if (error) {
					return reject(error);
				}

				return resolve(rows);
			});
		});
	}

	public static async getSessions(
		userId: string = "all",
		count: number = 30,
		offset: number = 0
	): Promise<IUserName[]> {
		return new Promise<IUserName[]>((resolve, reject) => {
			if (!this.database) {
				return reject(new Error("Database is not initialized!"));
			}

			let sql = "SELECT";
			sql += "  JSON_OBJECT('id', id, 'sessions', (";
			sql += "    SELECT JSON_GROUP_ARRAY(";
			sql += "      JSON_OBJECT(";
			sql += "        'platform', platform,";
			sql += "        'from', CAST(STRFTIME('%s', time_from) as INT),";
			sql += "        'to', CAST(STRFTIME('%s', time_to) as INT)))";
			sql += "    FROM sessions WHERE (user_id = id) AND (";
			sql += "    ROUND(JULIANDAY(time_from)) < (";
			sql += "    SELECT (ROUND(JULIANDAY(MIN(time_from)))";
			sql += "    + $count + $offset)";
			sql += "      FROM sessions as temp";
			sql += "      WHERE temp.user_id = user_id";
			sql += "    )) AND (";
			sql += "    ROUND(JULIANDAY(time_to)) >= (";
			sql += "      SELECT (ROUND(JULIANDAY(MIN(time_from))) + $offset)";
			sql += "      FROM sessions as temp";
			sql += "      WHERE temp.user_id = user_id";
			sql += "  )))) as data ";
			sql += "FROM users WHERE id = $userId or $userId = 'all'";

			this.database.all(
				sql,
				{ $userId: userId, $count: count, $offset: offset },
				(error, rows) => {
					if (error) {
						return reject(error);
					}

					return resolve(rows.map(x => JSON.parse(x.data)));
				}
			);
		});
	}

	///GET SESSION MAP HERE

	/**
	 * Safly stop and close the database
	 */
	public static close(): void {
		super.close();
		if (this.database) this.database.close();
	}
}

interface IUserName {
	id: string;
	name: string;
}
