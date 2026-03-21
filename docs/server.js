const path = require("path");
const express = require("express");
const server = express();

server.use("/index.css", express.static(path.join(__dirname, "./index.css")));
server.use("/index.js", express.static(path.join(__dirname, "../dist/index.js")));

server.use("/test-space.css", express.static(path.join(__dirname, "./test-space.css")));

server.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "/index.html"));
});

server.get("/test-space", (req, res) => {
    res.sendFile(path.join(__dirname, "/test-space.html"));
});

server.listen(3000, () => {
    console.log("server started on 3000");
});