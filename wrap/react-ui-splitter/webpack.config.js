const path = require('path');

module.exports = {
    target: ['web', 'es5'],
    entry: path.resolve(__dirname, "src/ts/index.tsx"),
    output: {
        path: path.resolve(__dirname, "dist"),
        libraryTarget: "umd",
        library: "SplitWrapper",
        filename: "index.js"
    },
    resolve: {
        extensions: ['.tsx', ".ts", ".js"]
    },
    module: {
        rules: [
            {
                test: /\.(tsx)$/,
                use: "ts-loader",
                exclude: /node_modules/
            }
        ]
    }
};
