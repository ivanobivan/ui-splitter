const path = require('path');

module.exports = {
    target: ['web', 'es5'],
    entry: [
        path.resolve(__dirname, "src/css/index.css"),
        path.resolve(__dirname, "src/ts/index.ts")
    ],
    output: {
        path: path.resolve(__dirname, "dist"),
        libraryTarget: "umd",
        filename: "index.js"
    },
    resolve: {
        extensions: ['.ts', ".js", '.css']
    },
    module: {
        rules: [
            {
                test: /\.(ts)$/,
                use: {
                    loader: "ts-loader",
                    options: {
                        "configFile": path.resolve(__dirname, "./tsconfig.json")
                    }
                }
            },
            {
                test: /\.(css)$/,
                use: ["style-loader", "css-loader", "postcss-loader"]
            }
        ]
    }
};
