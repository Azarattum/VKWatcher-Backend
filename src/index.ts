import DotEnv from "dotenv";
/**Main Script */
import App from "./components/app/app";

DotEnv.config();
const app = new App();
app.initialize();
