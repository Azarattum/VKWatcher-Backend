/**
 * Some useful utilities
 */
export default class Utils {
	/**
	 * Logs formatted text to the developer console
	 * @param text Text to log out
	 * @param type Custom type of the message
	 */
	public static log(text: string, type: LogType = LogType.INFO): void {
		const date = new Date().toTimeString().split(" ")[0];
		const prefix = `[${date}]: `;

		switch (type) {
			case LogType.INFO: {
				console.log(
					prefix + "%c\x1b[1mi\x1b[0m " + text,
					"font-weight:bold;"
				);
				break;
			}

			case LogType.OK: {
				console.log(
					prefix + "\x1b[32m\x1b[1m%c\u2713 " + text + "\x1b[0m",
					"color:green;font-weight:bold;"
				);
				break;
			}

			case LogType.ERROR: {
				console.error(
					prefix + "\x1b[31m\x1b[1m%c\u2718 " + text + "\x1b[0m",
					"color:red;font-weight:bold;"
				);
				break;
			}

			case LogType.WARNING: {
				console.log(
					prefix +
						"\x1b[33m\x1b[1m%c!\x1b[0m \x1b[33m" +
						text +
						"\x1b[0m",
					"color:goldenrod;font-weight:bold;"
				);
				break;
			}

			case LogType.DIVIDER: {
				const divider = "=".repeat(30 - text.length / 2);
				console.log(
					divider + text + divider + (text.length % 2 ? "=" : "")
				);
				break;
			}

			default:
				throw new TypeError("Unknown log type!");
		}
	}
}

/**
 * Logging message type
 */
export enum LogType {
	INFO,
	OK,
	WARNING,
	ERROR,
	DIVIDER
}
