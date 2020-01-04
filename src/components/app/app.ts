/**Utils */
import Manager, { IComponent } from "../common/manager.class";
import Api from "./services/api.class";
/**Components */
import Watcher from "./services/watcher.service";
import Events from "./services/events.service";
import Database from "./services/database.service";
import Sessions from "./services/sessions.service";

/**
 * Main application class
 */
export default class App {
	private manger: Manager | null = null;

	/**
	 * Initializes the app.
	 * Note that the page should be already loaded
	 */
	public async initialize(): Promise<void> {
		const components: IComponent[] = [Sessions, Watcher, Database, Events];

		this.manger = new Manager(components);
		const args = await this.initializeArguments();

		await this.manger.initialize(args);
	}

	/**
	 * Initializes arguments for the manager
	 */
	private async initializeArguments(): Promise<{
		[component: string]: any[];
	}> {
		if (!this.manger) {
			throw new Error("Initialize manager first!");
		}

		if (!process.env.VK_API_TOKEN) {
			throw new Error("VK api token not found in .env file!");
		}
		const api = new Api(process.env.VK_API_TOKEN);

		return {
			Watcher: [api]
		};
	}

	/**
	 * Closes the application
	 */
	public close(): void {
		if (this.manger) {
			this.manger.close();
			this.manger = null;
		}
	}

	public get initialized(): boolean {
		return this.manger != null;
	}

	public set logging(value: boolean) {
		if (!this.manger) return;
		this.manger.logging = value;
	}

	public get logging(): boolean {
		return this.manger ? this.manger.logging : false;
	}
}
