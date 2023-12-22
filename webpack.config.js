const path = require("path");
const webpack = require("webpack");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const CopyWebpackPlugin = require("copy-webpack-plugin");

const package = require("./package.json");
const entries = ["bingo"];

module.exports = {
    mode: process.env.NODE_ENV || "development", // "production",
    target: "web",
    entry: Object.fromEntries(entries.map(entry => {
        return [entry, path.join(__dirname, "apps", `${entry}.jsx`)];
    })),
    output: {
        path: path.join(__dirname, "www"),
        publicPath: "./",
        filename: "[name].[contenthash].js",
        // chunkFilename: "[name].[contenthash].chunk.js",
        assetModuleFilename: "assets/[hash][ext][query]",
    },
    // optimization: {
    //     splitChunks: {
    //         chunks: "all",
    //     },
    // },
    devServer: {
        hot: false,
        static: {
            directory: path.join(__dirname, "www"),
            staticOptions: {
                extensions: ["html"],
            },
        },
        devMiddleware: {
            writeToDisk: true,
        },
    },
    module: {
        rules: [
            {
                test: /\.(js|jsx)$/,
                include: [
                    __dirname,
                ],
                exclude: /(node_modules|www)/,
                loader: "babel-loader",
                options: {
                    presets: [
                        "@babel/preset-env", 
                        "@babel/preset-react",
                    ],
                    plugins: [
                        "@babel/plugin-transform-react-jsx",
                        "@babel/plugin-transform-runtime",
                    ],
                },
            },
            // {
            //     test: /\.(png|jpg|jpeg|svg)$/,
            //     type: "asset/resource",
            // },
            // {
            //     test: /\.(woff(2)?|ttf|eot|svg)(\?v=\d+\.\d+\.\d+)?$/,
            //     type: "asset/resource",
            // },
        ],
    },
    plugins: [
        new webpack.ProgressPlugin(),
        new webpack.DefinePlugin({
            "process.env.VERSION": JSON.stringify(package.version),
        }),
        ...entries.map(entry => {
            return new HtmlWebpackPlugin({
                template: path.join(__dirname, "template.html"),
                filename:  `${entry}.html`,
                inject: true,
                minify: false,
                chunks: [entry],
            });
        }),
        new CopyWebpackPlugin({
            patterns: [
                path.join(__dirname, "node_modules", "lowcss", "dist", "low.css"),
            ],
        }),
    ],
};
