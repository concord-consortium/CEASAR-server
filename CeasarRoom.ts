import { Room, Client } from "colyseus";
import { Schema, type, MapSchema } from "@colyseus/schema";

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
    if (movement.posX) {
      this.movePlayerToPosition(id, movement.posX, movement.posY);
    } else {
      if (movement.x) {
        this.players[id].x += movement.x;

      } else if (movement.y) {
        this.players[id].y += movement.y;
      }
    }
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
export class CeasarRoom extends Room<State> {
  onInit(options: any) {
    console.log("CeasarRoom created!", options);
    this.setState(new State());
  }
  onJoin(client: Client, options: any) {
    this.state.createPlayer(client.sessionId, options.username);
    this.broadcast(`${client.sessionId} joined.`);
  }
  onMessage(client: Client, data: any) {
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
  onLeave(client: Client, consented: boolean) {
    this.state.removePlayer(client.sessionId);
    this.broadcast(`${client.sessionId} left.`);
  }
  onDispose() {
    console.log("Dispose CeasarRoom");
  }
}
