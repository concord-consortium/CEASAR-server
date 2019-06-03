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
const port = Number(process.env.PORT || 2567);
const app = express_1.default();
app.use(cors_1.default());
const server = http_1.default.createServer(app);
const gameServer = new colyseus_1.Server({ server });
// register your room handlers
gameServer.register('ceasar', CeasarRoom_1.CeasarRoom);
// register colyseus monitor AFTER registering your room handlers
app.use("/colyseus", monitor_1.monitor(gameServer));
gameServer.listen(port);
console.log(`Listening on ws://heroku-server-port:${port}`);
