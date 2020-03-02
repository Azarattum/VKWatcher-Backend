import Sqlite from "sqlite3";
import FileSystem from "fs";
import Service from "../../common/service.abstract";
import User from "../models/user.class";
import { ISession } from "./sessions.service";
import DateUtils from "../../common/date.class";

/**
 * Service to work with the database
 */
export default class Database extends Service<"">() {
	private static database: Sqlite.Database | null = null;

	/**
	 * Initializes the datebase
	 */
	public static async initialize(): Promise<void> {
		return new Promise<void>(resolve => {
			//Create directory for data
			if (!FileSystem.existsSync("./data")) {
				FileSystem.mkdirSync("./data");
			}

			const promises: Promise<void>[] = [];
			this.database = new Sqlite.Database("./data/sessions.db");
			this.database.parallelize(() => {
				if (!this.database) return;

				//Create sessions table
				let sql = "CREATE TABLE IF NOT EXISTS sessions (";
				sql += "    user_id TEXT NOT NULL,";
				sql += "    platform INTEGER NOT NULL,";
				sql += "    time_from DATE NOT NULL,";
				sql += "    time_to DATE NOT NULL,";
				sql += "	UNIQUE (user_id, time_from)";
				sql += "	ON CONFLICT REPLACE";
				sql += ");";
				promises.push(
					new Promise<void>((resolve, reject) => {
						if (!this.database) return;
						this.database.run(sql, error => {
							if (error) return reject(error);
							return resolve();
						});
					})
				);

				//Create users table
				sql = "CREATE TABLE IF NOT EXISTS users (";
				sql += "    id TEXT PRIMARY KEY,";
				sql += "    name TEXT NOT NULL";
				sql += ");";
				promises.push(
					new Promise<void>((resolve, reject) => {
						if (!this.database) return;
						this.database.run(sql, error => {
							if (error) return reject(error);
							return resolve();
						});
					})
				);

				//Create map table
				sql = "CREATE TABLE IF NOT EXISTS map (";
				sql += "    user_id TEXT NOT NULL,";
				sql += "    hour INTEGER NOT NULL,";
				sql += "    time INTEGER NOT NULL,";
				sql += "	PRIMARY KEY (user_id, hour)";
				sql += ");";
				promises.push(
					new Promise<void>((resolve, reject) => {
						if (!this.database) return;
						this.database.run(sql, error => {
							if (error) return reject(error);
							return resolve();
						});
					})
				);

				Promise.all(promises).then(() => resolve());
			});
		});
	}

	/**
	 * Saves the creation of user into the database
	 * @param user User that was created
	 */
	public static async createUser(user: User): Promise<void> {
		return new Promise<void>((resolve, reject) => {
			if (!this.database) {
				return reject(new Error("Database is not initialized!"));
			}

			//Insert new user into the table
			let sql = "INSERT INTO users (id, name) ";
			sql += "VALUES($id, $name) ";
			sql += "EXCEPT ";
			sql += "SELECT id, name FROM users";
			this.database.run(
				sql,
				{ $id: user.id, $name: user.name },
				error => {
					if (error) return reject(error);
					return resolve();
				}
			);
		});
	}

	/**
	 * Saves the new session into the database
	 * @param user User that was created
	 */
	public static async addSession(session: ISession): Promise<void> {
		return new Promise<void>((resolve, reject) => {
			if (!this.database) {
				return reject(new Error("Database is not initialized!"));
			}
			if (!session.to) {
				return reject(new Error("Session.to is not defined!"));
			}

			const promises: Promise<void>[] = [];

			//Calculate all affected map periods
			let hour =
				DateUtils.getGlobalDay(session.from) * 24 +
				session.from.getHours();
			let time = (+session.to - +session.from) / 1000;
			let capacity =
				(60 - session.from.getMinutes()) * 60 -
				session.from.getSeconds();

			const periods: { [hour: number]: number } = {};
			while (time > 0) {
				periods[hour] = Math.min(time, capacity);
				time -= capacity;

				capacity = 60 * 60;
				hour++;
			}
			const entries = Object.entries(periods);

			//Update session map values
			let sql = "INSERT INTO map(user_id, hour, time) VALUES ";
			sql += entries.map(x => "(?,?,?)").join(",");
			sql += "	ON CONFLICT(hour,user_id) DO UPDATE SET";
			sql += "		time=excluded.time + map.time";

			const data: any[] = [];
			for (const entry of entries) {
				data.push(session.userId, ...entry);
			}

			promises.push(
				new Promise<void>((resolve, reject) => {
					if (!this.database) return;
					this.database.run(sql, data, error => {
						if (error) return reject(error);
						return resolve();
					});
				})
			);

			//Insert new session into the table
			sql = "INSERT INTO sessions";
			sql += "	(user_id, platform, time_from, time_to)";
			sql += "	VALUES($userId, $platform, $from, $to)";

			const data2 = {
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
			};

			promises.push(
				new Promise<void>((resolve, reject) => {
					if (!this.database) return;
					this.database.run(sql, data2, error => {
						if (error) return reject(error);
						return resolve();
					});
				})
			);

			Promise.all(promises).then(() => resolve());
		});
	}

	/**
	 * Returns user name(s) from the database
	 * @param id User id
	 */
	public static async getNames(id: string = "all"): Promise<IUserName[]> {
		return new Promise<IUserName[]>((resolve, reject) => {
			if (!this.database) {
				return reject(new Error("Database is not initialized!"));
			}

			this.database.all(
				"SELECT * FROM users WHERE id=$id or $id='all'",
				{ $id: id },
				(error, rows) => {
					if (error) return reject(error);
					return resolve(rows);
				}
			);
		});
	}

	/**
	 * Returns user days from the database
	 * @param id User id
	 */
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
				if (error) return reject(error);
				return resolve(rows);
			});
		});
	}

	/**
	 * Returns full user(s) information from the database
	 * @param id User id
	 */
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
				if (error) return reject(error);
				return resolve(rows);
			});
		});
	}

	/**
	 * Returns user's sessions from the database
	 * @param userId User id
	 * @param count Count of days
	 * @param offset Offset of days
	 */
	public static async getSessions(
		userId: string = "all",
		offset: number = 0,
		count: number = Infinity
	): Promise<IUserName[]> {
		return new Promise<IUserName[]>((resolve, reject) => {
			if (!this.database) {
				return reject(new Error("Database is not initialized!"));
			}
			if (count == Infinity) {
				count = Number.MAX_SAFE_INTEGER;
			}

			let sql = "SELECT";
			sql += "  JSON_OBJECT('id', id, 'sessions', (";
			sql += "    SELECT JSON_GROUP_ARRAY(";
			sql += "      JSON_OBJECT(";
			sql += "        'platform', platform,";
			sql += "        'from', CAST(STRFTIME('%s', time_from) as INT),";
			sql += "        'to', CAST(STRFTIME('%s', time_to) as INT)))";
			sql += "    FROM sessions WHERE (user_id = id) AND (";
			sql += "    ROUND(JULIANDAY(time_from)) <= (";
			sql += "    SELECT (ROUND(JULIANDAY(MAX(time_to)))";
			sql += "    - $offset)";
			sql += "      FROM sessions as temp";
			sql += "      WHERE temp.user_id = user_id";
			sql += "    )) AND (";
			sql += "    ROUND(JULIANDAY(time_to)) > (";
			sql += "      SELECT (ROUND(JULIANDAY(MAX(time_to)))";
			sql += "		- $offset - $count)";
			sql += "      FROM sessions as temp";
			sql += "      WHERE temp.user_id = user_id";
			sql += "  )))) as data ";
			sql += "FROM users WHERE id = $userId or $userId = 'all'";

			this.database.all(
				sql,
				{ $userId: userId, $count: count, $offset: offset },
				(error, rows) => {
					if (error) return reject(error);

					return resolve(rows.map(x => JSON.parse(x.data)));
				}
			);
		});
	}

	/**
	 * Returns users density session map from the database
	 * @param offset Offset of hours (including that hour)
	 */
	public static async getMap(offset: number = 0): Promise<ISessionMap> {
		return new Promise<ISessionMap>((resolve, reject) => {
			if (!this.database) {
				return reject(new Error("Database is not initialized!"));
			}

			let sql = "SELECT";
			sql += "    JSON_OBJECT(";
			sql += "        id,";
			sql += "        (SELECT";
			sql += "            JSON_GROUP_OBJECT(CAST(hour as TEXT), time)";
			sql += "        FROM map WHERE user_id = id and hour >= $offset)";
			sql += "    ) as data ";
			sql += "FROM users";

			this.database.all(sql, { $offset: offset }, (error, rows) => {
				if (error) return reject(error);

				const map: {} = {};
				for (const row of rows) {
					const object = JSON.parse(row["data"]);
					if (Object.values(object)[0] != null) {
						Object.assign(map, object);
					}
				}

				return resolve(map);
			});
		});
	}

	/**
	 * Safely stop and close the database
	 */
	public static async close(): Promise<void> {
		super.close();
		return new Promise<void>((resolve, reject) => {
			if (this.database) {
				this.database.close(error => {
					if (error) return reject(error);
					return resolve();
				});
			} else {
				return resolve();
			}
		});
	}
}

/**
 * Represents user's name info
 */
interface IUserName {
	id: string;
	name: string;
}

/**
 * Represents users sessions density map
 */
interface ISessionMap {
	[userId: string]: { [day: string]: number };
}
