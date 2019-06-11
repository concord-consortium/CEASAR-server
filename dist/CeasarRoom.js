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
class NetworkVector3 extends schema_1.Schema {
    constructor() {
        super(...arguments);
        this.x = 0;
        this.y = 0;
        this.z = 0;
    }
}
__decorate([
    schema_1.type("number")
], NetworkVector3.prototype, "x", void 0);
__decorate([
    schema_1.type("number")
], NetworkVector3.prototype, "y", void 0);
__decorate([
    schema_1.type("number")
], NetworkVector3.prototype, "z", void 0);
class NetworkTransform extends schema_1.Schema {
    constructor() {
        super(...arguments);
        this.position = new NetworkVector3();
        this.rotation = new NetworkVector3();
    }
}
__decorate([
    schema_1.type(NetworkVector3)
], NetworkTransform.prototype, "position", void 0);
__decorate([
    schema_1.type(NetworkVector3)
], NetworkTransform.prototype, "rotation", void 0);
class Player extends schema_1.Schema {
    constructor() {
        super(...arguments);
        this.id = "";
        this.username = "";
        this.currentScene = "stars";
        this.x = Math.floor(Math.random() * 10) - 5;
        this.y = Math.floor(Math.random() * 10) - 5;
        this.playerPosition = new NetworkTransform();
        this.interactionTarget = new NetworkTransform();
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
__decorate([
    schema_1.type(NetworkTransform)
], Player.prototype, "playerPosition", void 0);
__decorate([
    schema_1.type(NetworkTransform)
], Player.prototype, "interactionTarget", void 0);
exports.Player = Player;
class State extends schema_1.Schema {
    constructor() {
        super(...arguments);
        this.players = new schema_1.MapSchema();
    }
    createPlayer(id, username) {
        this.players[id] = new Player();
        this.players[id].username = username;
        this.players[id].id = id;
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
    syncInteraction(id, interaction) {
        var t = new NetworkTransform();
        t.position.x = interaction.transform.position.x;
        t.position.y = interaction.transform.position.y;
        t.position.z = interaction.transform.position.z;
        t.rotation.x = interaction.transform.rotation.x;
        t.rotation.y = interaction.transform.rotation.y;
        t.rotation.z = interaction.transform.rotation.z;
        this.players[id].interactionTarget = t;
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
        this.state.createPlayer(client.sessionId, options.username);
        this.broadcast(`${client.sessionId} joined.`);
    }
    onMessage(client, data) {
        switch (data.message) {
            case "movement":
                console.log("CeasarRoom received movement message from", client.sessionId, ":", data);
                this.state.movePlayer(client.sessionId, data.message);
                this.broadcast(`${client.sessionId} movement`);
                break;
            case "interaction":
                console.log("CeasarRoom received interaction from", client.sessionId, ":", data);
                this.state.syncInteraction(client.sessionId, data);
                this.broadcast(`${client.sessionId} interaction`);
                break;
            case "heartbeat":
                // do nothing
                break;
            default:
                console.log("CeasarRoom received unknown message from", client.sessionId, ":", data);
                this.broadcast(`(${client.sessionId}) ${data.message}`);
                break;
        }
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
