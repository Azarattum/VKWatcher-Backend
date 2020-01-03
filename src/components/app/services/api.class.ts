/* eslint-disable @typescript-eslint/camelcase */
import Request from "request-promise-native";
import User, { IDetails } from "../models/user.class";

const URL = "https://api.vk.com/method/";

/**
 * Handing all api calls
 */
export default class Api {
	private readonly url: string;
	private readonly params: object;

	/**
	 * Creates an api object
	 * @param token Api access token
	 */
	public constructor(token: string) {
		this.url = URL;
		this.params = {
			access_token: token,
			v: "5.101"
		};
	}

	/**
	 * Fetches your friend list
	 */
	public async getFrieds(): Promise<User[]> {
		//Make an api call
		const method = "friends.get";
		const response = await Request.post(this.url + method, {
			form: { ...this.params, fields: "last_seen,online" }
		});

		//Sanitize the response
		const object = JSON.parse(response);
		if (typeof object["response"] != "object") return [];
		if (!Array.isArray(object["response"]["items"])) return [];

		//Format the response
		const users: User[] = [];
		for (const item of object["response"]["items"]) {
			//Validate the user item
			if (
				!item.id ||
				!item.first_name ||
				!item.last_name ||
				typeof item.online != "number"
			) {
				continue;
			}

			let details: IDetails | undefined = undefined;
			if (typeof item["last_seen"] == "object") {
				const time = +item["last_seen"]["time"] * 1000;
				const platform = +item["last_seen"]["platform"] || 0;
				const date = time ? new Date(time) : new Date();

				details = {
					lastSeen: date,
					platform: platform
				};
			}

			const user = new User(
				item.id + "",
				item.first_name + " " + item.last_name,
				item.online + "" == "1",
				details
			);

			users.push(user);
		}

		return users;
	}

	/**
	 * Fetches online friend's ids
	 */
	public async getOnline(): Promise<number[]> {
		//Make an api call
		const method = "friends.getOnline";
		const response = await Request.post(this.url + method, {
			form: { ...this.params, online_mobile: "0" }
		});

		//Sanitize the response
		const object = JSON.parse(response);
		if (!Array.isArray(object["response"])) return [];

		return object["response"];
	}
}
