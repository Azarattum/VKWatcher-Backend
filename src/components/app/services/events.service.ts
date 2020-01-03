import Service from "../../common/service.abstract";

/**
 * One service to rule them all!
 * Registers and manages event-driven communication
 * among all services
 */
export default class Envets extends Service<"registered">() {
	public static async initialize(): Promise<void> {
		///Register service events here

		this.call("registered");
	}
}
