import dotenv from "dotenv"
dotenv.config()
import http from "http";
import express from "express";
import cors from "cors";
import { Server } from "colyseus";
import { monitor } from "@colyseus/monitor";
import { CeasarRoom } from "./CeasarRoom";

import socialRoutes from "@colyseus/social/express";

const port = Number(process.env.PORT || 2567);
const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const gameServer = new Server({
  server,
  express: app,
  pingTimeout: 0
});

const roomNames =
[
  'alpha', 'beta', 'gamma',
  'delta', 'epsilon', 'zeta',
  'eta', 'theta', 'iota'
];

roomNames.forEach(name => gameServer.define(name, CeasarRoom));

// register your room handlers
gameServer.define('ceasar', CeasarRoom);

app.use("/", socialRoutes);
// register colyseus monitor AFTER registering your room handlers
app.use("/colyseus", monitor(gameServer));

gameServer.listen(port);
// v1 used ws://calm-meadow-14344.herokuapp.com:2567
console.log(`Listening on port:${ port }`)
