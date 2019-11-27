"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const http_1 = __importDefault(require("http"));
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const colyseus_1 = require("colyseus");
const monitor_1 = require("@colyseus/monitor");
const CeasarRoom_1 = require("./CeasarRoom");
const express_2 = __importDefault(require("@colyseus/social/express"));
const port = Number(process.env.PORT || 2567);
const app = express_1.default();
app.use(cors_1.default());
app.use(express_1.default.json());
const server = http_1.default.createServer(app);
const gameServer = new colyseus_1.Server({
    server,
    express: app,
    pingTimeout: 0
});
// register your room handlers
gameServer.define('ceasar', CeasarRoom_1.CeasarRoom);
app.use("/", express_2.default);
// register colyseus monitor AFTER registering your room handlers
app.use("/colyseus", monitor_1.monitor(gameServer));
gameServer.listen(port);
// v1 used ws://calm-meadow-14344.herokuapp.com:2567
console.log(`Listening on port:${port}`);
