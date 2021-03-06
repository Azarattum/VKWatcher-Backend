/* eslint-disable node/no-unpublished-require */
/* eslint-disable @typescript-eslint/camelcase */
/* eslint-disable @typescript-eslint/no-empty-function */
/* eslint-disable @typescript-eslint/explicit-function-return-type */
const Path = require("path");
const TerserPlugin = require("terser-webpack-plugin");
const WebpackCleanupPlugin = require("webpack-cleanup-plugin");
const NodeExternals = require("webpack-node-externals");

const prod = process.argv.indexOf("-p") !== -1;

module.exports = {
	entry: "./src/index.ts",
	mode: prod ? "production" : "development",
	target: "node",
	devtool: prod ? undefined : "eval-source-map",
	plugins: [prod ? new WebpackCleanupPlugin() : () => {}],
	module: {
		rules: [
			{
				test: /\.ts$/,
				use: [
					{
						loader: "ts-loader",
						options: {
							transpileOnly: false,
							experimentalWatchApi: true
						}
					}
				],
				include: Path.resolve(__dirname, "./src"),
				exclude: /node_modules/
			}
		]
	},
	externals: [NodeExternals()],
	resolve: {
		extensions: [".ts", ".js"]
	},
	output: {
		filename: "bundle.js",
		pathinfo: false,
		path: Path.resolve(__dirname, "./dist")
	},
	optimization: {
		concatenateModules: false,
		minimize: prod ? true : false,
		minimizer: prod
			? [
					new TerserPlugin({
						terserOptions: {
							mangle: true,
							sourceMap: false,
							keep_classnames: true
						},
						extractComments: false
					})
			  ]
			: []
	}
};
