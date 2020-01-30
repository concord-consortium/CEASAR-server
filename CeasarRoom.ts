import { Room, Client } from "colyseus";
import { Schema, type, MapSchema, ArraySchema } from "@colyseus/schema";
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

  @type(NetworkVector3)
  localScale = new NetworkVector3();

  @type("string")
  name = "";

  constructor(transformObject?: any) {
    super();
    if (transformObject) {
      this.position = new NetworkVector3(transformObject.position);
      this.rotation = new NetworkVector3(transformObject.rotation);
      this.localScale = new NetworkVector3(transformObject.localScale);
      this.name = transformObject.name ? transformObject.name : "";
    }
  }
  toString() {
    return `(${this.position.x},${this.position.y},${this.position.z}) (${this.rotation.x},${this.rotation.y},${this.rotation.z}) (${this.localScale.x},${this.localScale.y},${this.localScale.z})`;
  }
}

class NetworkCelestialObject extends Schema {
  @type("string")
  name = "";
  // a group could be a constellation for a star, or a useful parent concept like "planet" or "satellite"
  // we may need this on the client.
  @type("string")
  group = "";
  // unique ID can be XBayerFlemsteed for a star, or perhaps a string name for a planet
  // our Client can have authority over uniqueness to simplify server layer
  @type("string")
  uniqueId = "";

  constructor(celestialObject?: any) {
    super();
    if (celestialObject) {
      this.name = celestialObject.name;
      this.group = celestialObject.group;
      this.uniqueId = celestialObject.uniqueId;
    }
  }
}

class NetworkPerspectivePin extends Schema {
  @type("number")
  latitude = 0;
  @type("number")
  longitude = 0;
  @type("number")
  datetime = Date.now();
  @type(NetworkTransform)
  cameraTransform = new NetworkTransform();

  constructor(locationDatetime?: any, locationLatitude?: any, locationLongitude?: any, userCameraTransform?: any) {
    super();
    if (locationDatetime) this.datetime = locationDatetime;
    if (locationLatitude) this.latitude = locationLatitude;
    if (locationLongitude) this.longitude = locationLongitude;
    if (userCameraTransform) this.cameraTransform = new NetworkTransform(userCameraTransform);
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

  @type(NetworkPerspectivePin)
  locationPin = new NetworkPerspectivePin();

  @type(NetworkCelestialObject)
  celestialObjectTarget = new NetworkCelestialObject();

  @type([ NetworkTransform ])
  annotations = new ArraySchema<NetworkTransform>();

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
  syncLocationPin(id: string, perspectivePin: any) {
    this.players[id].locationPin = new NetworkPerspectivePin(perspectivePin.datetime, perspectivePin.latitude, perspectivePin.longitude, perspectivePin.cameraTransform);
  }

  syncCelestialObjectInteraction(id: string, celestialObject: any) {
    this.players[id].celestialObjectTarget = new NetworkCelestialObject(celestialObject);
  }

  syncAnnotation(id: string, annotation: any) {
    let t = new NetworkTransform(annotation);
    this.players[id].annotations.push(new NetworkTransform(annotation));
  }

  syncDeleteAnnotation(id: string, annotationName: any) {
    let annotations = this.players[id].annotations;
    let annotationIndex = -1;
    for (let i = 0; i < annotations.length; i++){
      if (annotations[i].name === annotationName){
        annotationIndex = i;
        break;
      }
    }
    if (annotationIndex > -1){
      this.players[id].annotations.splice(annotationIndex, 1);
    }

  }
}

export class UpdateMessage extends Schema {
  @type("string")
  updateType = "";
  @type("string")
  playerId = "";
  @type("string")
  metadata = "";
}
export class CeasarRoom extends Room {
  onCreate(options: any) {
    debug(`CeasarRoom created ${this.roomName}`);
    this.setState(new State());
  }

  async onAuth(client: Client, options: any) {
    debug(`onAuth(), options! ${options}`);
    return await User.findById(verifyToken(options.token)._id);
  }

  reportState() {
    debug(`Info for room: ${this.roomName}`);
    debug(this.state.toJSON());
  }

  onJoin(client: Client, options: any, user: IUser) {
    this.state.createPlayer(client.sessionId, options.username);
    this.broadcast(`${client.sessionId} joined.`);
    this.reportState();
  }

  sendUpdateMessage(messageType: string, client: Client, metadata?: string) {
    // Sent to all connected clients to update remote interactions
    // For now, using strings on both ends,
    // care needs to be taken to match available types of messages
    const responseData = new UpdateMessage();
    responseData.updateType = messageType;
    responseData.playerId = client.sessionId;
    responseData.metadata = metadata ? metadata : "";
    this.broadcast(responseData, { afterNextPatch: true, except: client });
  }

  onMessage(client: Client, data: any) {
    switch (data.message) {
      case "movement":
        debug(`CeasarRoom received movement from ${client.sessionId}: ${data}`);
        this.state.movePlayer(client.sessionId, data.transform);
        this.sendUpdateMessage("movement", client);
        break;
      case "interaction":
        debug(`CeasarRoom received interaction from ${client.sessionId}: ${data}`);
        this.state.syncInteraction(client.sessionId, data.transform);
        this.sendUpdateMessage("interaction", client);
        break;
      case "locationpin":
        debug(`CeasarRoom received locationpin from ${client.sessionId}: ${data}`);
        this.state.syncLocationPin(client.sessionId, data.perspectivePin);
        this.sendUpdateMessage("locationpin", client);
        break;
      case "celestialinteraction":
        debug(`CeasarRoom received celestialInteraction from ${client.sessionId}: ${data}`);
        this.state.syncCelestialObjectInteraction(client.sessionId, data.celestialObject);
        this.sendUpdateMessage("celestialinteraction", client);
        break;
      case "annotation":
        debug(`CeasarRoom received annotation from ${client.sessionId}: ${data}`);
        this.state.syncAnnotation(client.sessionId, data.transform);
        this.sendUpdateMessage("annotation", client);
        break;
      case "deleteannotation":
        debug(`CeasarRoom received delete annotation from ${client.sessionId}: ${data}`);
        this.state.syncDeleteAnnotation(client.sessionId, data.annotationName);
        this.sendUpdateMessage("deleteannotation", client, data.annotationName);
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
