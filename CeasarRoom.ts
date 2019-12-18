import { Room, Client } from "colyseus";
import { Schema, type, MapSchema } from "@colyseus/schema";
import { verifyToken, User, IUser } from "@colyseus/social";
import { debug } from "./utils";

class NetworkVector3 extends Schema {
  @type("number")
  x = 0;
  @type("number")
  y = 0;
  @type("number")
  z = 0;
}
class NetworkTransform extends Schema {
  @type(NetworkVector3)
  position = new NetworkVector3();

  @type(NetworkVector3)
  rotation = new NetworkVector3();
}

export class Player extends Schema {
  @type("string")
  id = "";

  @type("string")
  username = "";

  @type("string")
  currentScene = "stars";

  @type("number")
  x = Math.floor(Math.random() * 10) - 5;

  @type("number")
  y = Math.floor(Math.random() * 10) - 5;

  @type(NetworkTransform)
  playerPosition = new NetworkTransform();

  @type(NetworkTransform)
  interactionTarget = new NetworkTransform();

  @type("boolean")
  connected: boolean = true;
}

export class State extends Schema {
  @type({ map: Player })
  players = new MapSchema<Player>();

  createPlayer (id: string, username: string) {
    this.players[id] = new Player();
    this.players[id].username = username;
    this.players[id].id = id;
  }

  removePlayer (id: string) {
      delete this.players[ id ];
  }

  movePlayer(id: string, movement: any) {
    var t: NetworkTransform = new NetworkTransform();

    t.position.x = movement.transform.position.x;
    t.position.y = movement.transform.position.y;
    t.position.z = movement.transform.position.z;
    t.rotation.x = movement.transform.rotation.x;
    t.rotation.y = movement.transform.rotation.y;
    t.rotation.z = movement.transform.rotation.z;

    this.players[id].playerPosition = t;
  }

  syncInteraction(id: string, interaction: any) {
    var t: NetworkTransform = new NetworkTransform();

    t.position.x = interaction.transform.position.x;
    t.position.y = interaction.transform.position.y;
    t.position.z = interaction.transform.position.z;
    t.rotation.x = interaction.transform.rotation.x;
    t.rotation.y = interaction.transform.rotation.y;
    t.rotation.z = interaction.transform.rotation.z;

    this.players[id].interactionTarget = t;

  }

  movePlayerToPosition(id: string, posX: number, posY: number) {
    this.players[id].x = posX;
    this.players[id].y = posY;
  }
}
export class CeasarRoom extends Room {
  onCreate(options: any) {
    debug(`CeasarRoom created! ${options}`);
    this.setState(new State());
  }

  async onAuth(client: Client, options: any) {
    debug(`onAuth(), options! ${options}`);
    return await User.findById(verifyToken(options.token)._id);
  }

  reportState() {
    debug(this.state.toJSON());
  }

  onJoin(client: Client, options: any, user: IUser) {
    this.state.createPlayer(client.sessionId, options.username);
    this.broadcast(`${client.sessionId} joined.`);
    this.reportState();
  }

  onMessage(client: Client, data: any) {
    switch (data.message) {
      case "movement":
        debug(`CeasarRoom received movement from ${client.sessionId}: ${data}`);
        this.state.movePlayer(client.sessionId, data);
        this.broadcast({ movement: `${client.sessionId} movement` });
        break;
      case "interaction":
        debug(`CeasarRoom received interaction from ${client.sessionId}: ${data}`);
        this.state.syncInteraction(client.sessionId, data);
        this.broadcast({ interaction: `${client.sessionId} interaction`});
        break;
      case "heartbeat":
        // do nothing
        break;
      default:
        debug(`CeasarRoom received unknown message from ${client.sessionId}: ${data}`);
        this.broadcast({ message: `(${client.sessionId}) ${data.message}` });
        break;
    }
    this.reportState();
  }
  async onLeave(client: Client, consented: boolean) {
    this.state.players[client.sessionId].connected = false;
    try {
      if (consented) { debug("consented leave"); }
      debug("wait for reconnection!");
      const newClient = await this.allowReconnection(client, 1);
      debug(`reconnected! ${newClient.sessionId}`);
      this.state.players[client.sessionId].connected = true;
      this.reportState();
    } catch (e) {
      debug(`disconnected! ${client.sessionId}`);
      delete this.state.players[client.sessionId];
      this.broadcast(`${client.sessionId} left.`);
      this.reportState();
    }
  }
  onDispose() {
    debug("Dispose CeasarRoom");
  }
}
