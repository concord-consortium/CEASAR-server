# `ceasar-server`

A multiplayer game server for the [CEASAR](https://github.com/concord-consortium/CEASAR) project, based on [Colyseus](https://colyseus.io).

## :crossed_swords: Usage
* If this is the first time running the app, run: `npm install`
* If things are busted, try a nuke-and-repave: `./repave.sh`

## Colyseus v0.13 monkey patch

Make sure that `npm postinstall` script is executed (it should happen automatically, but you can also do it manually).
It applies a monkey patch to Colyseus server v0.13 that lets us deploy server to a subroute:

https://apps.concord.org/ceasar-server

Otherwise, this app would need to be deplpyed to a top-level path (htts://ceasar-server.concord.org), which doesn't
fit our deployment patterns.

This bug was fixed in Colyseus v0.14, but this version that is not compatible with v0.13 client used by CEASAR Unity3D
front-end. Long-term, both the server and the client should be updated to v0.14. This didn't happen in March 2023 due to
issues with building the client code (Unity) and limited time.

The monkey patch is based on this fix:
https://github.com/colyseus/colyseus/commit/fd9298aa3bc2d271d0764ce45e720fe5ffee1399

## Development:

### Local requirements:
You will need to add a local `.env` file to this project directory.
*Important: `.env` should always be included in `.gitignore`*

The only variable necessary to set is BASE_PATH. It can be set to / or any other path that you use in the front-end app.

### Running Locally:

To start a live-reloading development server run:
```
  npm install
  npm run live
```

### Debugging

For additional debugging & logging add `CEASAR_DEBUG=true` to your local `.env` file.

Your Ceaser Websocket should then be available at `ws://localhost:3000`.

## Changing the Schema:

To regenerate the schema for the room, assuming project CEASAR is at same level as this on your system:

```
   npx schema-codegen CeasarRoom.ts --csharp --output ../CEASAR/Assets/Scripts/Network/Schema/
```

## AWS Deployment:
CEASAR-server is deployed to AWS Fargate using Cloud Formation template. Check CC CloudFormation template repository:
https://github.com/concord-consortium/cloud-formation/tree/master/fargate

## Project Structure

- `index.ts`: main entry point, register room handlers and attach [`@colyseus/monitor`](https://github.com/colyseus/colyseus-monitor)
- `CeasarRoom.ts`: The main room handler, contains all schema definitions and room state
- `package.json`:
    - `scripts`:
        - `npm live`: runs `ts-node index.ts`
    - `dependencies`:
        - `colyseus`
        - `@colyseus/monitor`
        - `express`
        - `dotenv`
    - `devDependencies`
        - `ts-node`
        - `typescript`
        - `rimraf`
- `tsconfig.json`: TypeScript configuration file
- `patches`: Colyseus monkey-patch source

## License

MIT
