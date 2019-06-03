"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
const colyseus_1 = require("colyseus");
const schema_1 = require("@colyseus/schema");
class Player extends schema_1.Schema {
    constructor() {
        super(...arguments);
        this.id = "";
        this.username = "";
        this.currentScene = "stars";
        this.x = Math.floor(Math.random() * 10) - 5;
        this.y = Math.floor(Math.random() * 10) - 5;
    }
}
__decorate([
    schema_1.type("string")
], Player.prototype, "id", void 0);
__decorate([
    schema_1.type("string")
], Player.prototype, "username", void 0);
__decorate([
    schema_1.type("string")
], Player.prototype, "currentScene", void 0);
__decorate([
    schema_1.type("number")
], Player.prototype, "x", void 0);
__decorate([
    schema_1.type("number")
], Player.prototype, "y", void 0);
exports.Player = Player;
class State extends schema_1.Schema {
    constructor() {
        super(...arguments);
        this.players = new schema_1.MapSchema();
    }
    createPlayer(id) {
        this.players[id] = new Player();
    }
    removePlayer(id) {
        delete this.players[id];
    }
    movePlayer(id, movement) {
        if (movement.posX) {
            this.movePlayerToPosition(id, movement.posX, movement.posY);
        }
        else {
            if (movement.x) {
                this.players[id].x += movement.x;
            }
            else if (movement.y) {
                this.players[id].y += movement.y;
            }
        }
    }
    movePlayerToPosition(id, posX, posY) {
        this.players[id].x = posX;
        this.players[id].y = posY;
    }
}
__decorate([
    schema_1.type({ map: Player })
], State.prototype, "players", void 0);
exports.State = State;
class CeasarRoom extends colyseus_1.Room {
    onInit(options) {
        console.log("CeasarRoom created!", options);
        this.setState(new State());
    }
    onJoin(client, options) {
        this.state.createPlayer(client.sessionId);
        this.broadcast(`${client.sessionId} joined.`);
    }
    onMessage(client, data) {
        console.log("CeasarRoom received message from", client.sessionId, ":", data);
        this.state.movePlayer(client.sessionId, data);
        this.broadcast(`(${client.sessionId}) ${data.message}`);
    }
    onLeave(client, consented) {
        this.state.removePlayer(client.sessionId);
        this.broadcast(`${client.sessionId} left.`);
    }
    onDispose() {
        console.log("Dispose CeasarRoom");
    }
}
exports.CeasarRoom = CeasarRoom;
