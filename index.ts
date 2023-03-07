import dotenv from "dotenv"
dotenv.config()
import http from "http";
import express from "express";
import cors from "cors";
import { Server } from "colyseus";
import { monitor } from "@colyseus/monitor";
import { CeasarRoom } from "./CeasarRoom";

const port = Number(process.env.PORT || 3000);
const basePath = process.env.BASE_PATH || "/";

const app = express();
app.use(cors());

// 2021-08-18 NP: Heroku will take down our socket if its idle for > 55s
// Websocket clients can not keep this socket alive when the tab is hidden.
// So we keep the connection alive by pinging clients every 20s.
// Clients that don't respond three times are OUT! ⚾⚾⚾
const gameServer = new Server({
  server: http.createServer(app),
  pingInterval: 20 * 1000,
  pingMaxRetries: 3
});

const roomNames =
[
  'alpha', 'beta', 'gamma',
  'delta', 'epsilon', 'zeta',
  'eta', 'theta', 'iota'
];

// register your room handlers
roomNames.forEach(name => gameServer.define(name, CeasarRoom));

// health check path, necessary for AWS Fargate deployment
app.get('/health', (req, res) => {
  res.sendStatus(200);
});

// register colyseus monitor AFTER registering your room handlers
app.use(`${basePath}`, monitor() );

gameServer.listen(port);

console.log(`Base path:${ basePath }`)
console.log(`Listening on port:${ port }`)
