const path = require("path");
const fs = require("fs");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const { CleanWebpackPlugin } = require("clean-webpack-plugin");
const appDirectory = fs.realpathSync(process.cwd());
module.exports = {
    entry: path.resolve(appDirectory, "src/app.ts"), //path to the main .ts file
    output: {
        chunkFilename: '[id].[chunkhash].js',
        // filename: "js/bundle.js", //name for the js file that is created/compiled in memory
		webassemblyModuleFilename: "[name].wasm",
        path: path.resolve(__dirname, "dist"),
    },
    devtool: "eval-source-map",
    resolve: {
        extensions: [".tsx", ".ts", ".js", ".wasm"],
        fallback: {
            "crypto": false,
            "fs": false,        
            "browser": false,
            "path": false,
        }
    },
    devServer: {
        host: "0.0.0.0",
        port: 8080, //port that we're using for local host (localhost:8080)
        disableHostCheck: true,
        contentBase: path.resolve(appDirectory, "public"), //tells webpack to serve from the public folder
        publicPath: "/",
        hot: true,
    },
    module: {
        rules: [
            {
                test: /\.tsx?$/,
                use: "ts-loader",
                exclude: /node_modules/,
            },
			{
                test: /\.wasm?$/,
				type: "webassembly/async"
			},
            {
                test: /\.ifc?$/,
                use: 'raw-loader',
            }
        ],
    },
    plugins: [
        new HtmlWebpackPlugin({
            inject: true,
            template: path.resolve(appDirectory, "public/index.html"),
        }),
        new CleanWebpackPlugin(),
    ],
    mode: "development",
    experiments: {
		syncWebAssembly: true
	}
};