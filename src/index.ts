/* eslint-disable no-process-exit */
import DotEnv from "dotenv";
import FileSystem from "fs";
import Utils, { LogType } from "./components/common/utils.class";
/**Main Script */
import App from "./components/app/app";

DotEnv.config();

const app = new App();

process.on("exit", app.close.bind(app));
process.on("SIGINT", exitHandler);
process.on("SIGUSR1", exitHandler);
process.on("SIGUSR2", exitHandler);

process.on("uncaughtException", restartHandler);
process.on("unhandledRejection", restartHandler as any);

app.initialize();

/**
 * Handles application exit
 */
function exitHandler(): void {
	app.close();
	process.exit();
}

/**
 * Handles application restart
 * @param exception Restart exception
 */
function restartHandler(exception: Error): void {
	//Crash log
	const error = (exception.stack || "").replace(/\n/g, "\n\t");
	const fileName = `./crashes/${new Date().toDateString()}.txt`;
	const message = `Runtime exception:\n\t${error}`;
	const format = `[${new Date().toTimeString()}]: ${message}\r\n\r\n`;

	if (!FileSystem.existsSync("./crashes")) {
		FileSystem.mkdirSync("./crashes");
	}
	FileSystem.appendFileSync(fileName, format);
	Utils.log(message, LogType.ERROR);

	//Restart application
	app.logging = false;
	app.close();

	Utils.log("Restarting the script in 3 seconds...");
	setTimeout(() => {
		if (!app.initialized) {
			app.initialize();
		}
	}, 3000);
}
