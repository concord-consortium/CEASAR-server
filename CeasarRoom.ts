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
  constructor(vector3Object?: any) {
    super();
    if (vector3Object) {
      this.x = vector3Object.x;
      this.y = vector3Object.y;
      this.z = vector3Object.z;
    }
  }
}
class NetworkTransform extends Schema {
  @type(NetworkVector3)
  position = new NetworkVector3();

  @type(NetworkVector3)
  rotation = new NetworkVector3();

  constructor(transformObject?: any) {
    super();
    if (transformObject) {
      this.position = new NetworkVector3(transformObject.position);
      this.rotation = new NetworkVector3(transformObject.rotation);
    }
  }
}

export class Player extends Schema {
  @type("string")
  id = "";

  @type("string")
  username = "";

  @type("string")
  currentScene = "stars";

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

  movePlayer(id: string, movementTransform: any) {
    this.players[id].playerPosition = new NetworkTransform(movementTransform);
  }

  syncInteraction(id: string, interactionTransform: any) {
    this.players[id].interactionTarget = new NetworkTransform(interactionTransform);
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
        this.state.movePlayer(client.sessionId, data.transform);
        this.broadcast({ movement: `${client.sessionId} movement` });
        break;
      case "interaction":
        debug(`CeasarRoom received interaction from ${client.sessionId}: ${data}`);
        this.state.syncInteraction(client.sessionId, data.transform);
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
  onLeave(client: Client, consented: boolean) {
    this.broadcast(`${client.sessionId} left.`);
    this.reportState();
    debug("wait for reconnection!");
    this.allowReconnection(client, 2)
    .then( (newClient) => {
      debug(`new Client: ${newClient}`);
      debug(JSON.stringify(newClient,null,"  "));
      debug(`reconnected! ${newClient.sessionId}`);
      this.state.players[newClient.sessionId].connected = true;
      this.reportState();
    }).catch( (reason: any) => {
      debug(reason);
      debug(JSON.stringify(reason, null, " "));
      debug(`disconnected! ${client.sessionId}`);
      this.state.removePlayer(client.sessionId);
      this.reportState();
    })
  }
  onDispose() {
    debug("Dispose CeasarRoom");
  }
}
