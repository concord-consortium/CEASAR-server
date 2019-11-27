# `ceasar-server`

A CEASER Game server based on `create-colyseus-app`.

## :crossed_swords: Usage
* If this is the first time running the app, run: `npm install`
* If things are busted, try a nuke-and-repave: `./repave.sh`

## Development:

### Local requirements:  
You will need to add a local `.env` file to this project directory.
*Important: `.env` should always be included in `.gitignore`*

The `.env` file should contain one environmental variable for the mongo server:

```
    MONGO_URI=mongodb://[user]:[password]@[host]
```

You will need to obtain that URI from another developer or from
Config Var of the same name in the Heroku [ceaser-server-staging app](https://dashboard.heroku.com/apps/ceaser-server-staging/settings).

### Running Locally:

To start a live-reloading development server run:
```
   npm run live
```

Your Ceaser Websocket should then be available at `ws://localhost:2567`.

## Changing the Schema:

To regenerate the schema for the room, assuming project CEASAR is at same level as this on your system:

```
   npx schema-codegen CeasarRoom.ts --csharp --output ../CEASAR/Assets/Scripts/Network/
```

## Heroku Deployment:
Ceaser-server is Heroku app setup under the Concord Consortium account.

Heroku will look for pushed github branches to run as apps. *`master`* is automatically
deployed. Other branches can be configured using the Heroku web console as preview apps.

The Heroku pipeline looks at `package.json` to figure out how to build and run
the Caeser-server app. First `heroku-postbuild` is run which builds the `/dist`
folder, then `start` is run, which executes `node dist/index.ts`.

### Preview Branches
Pushing changes to *any* branch should cause a Heroku preview app to be built.
You will need to configure the apps settings, to add a `MONGO_URI` config var.
For now you can just copy the `MONGO_URI` config var from the
[staging-app settings](https://dashboard.heroku.com/apps/ceasar-server-staging/settings).

### Staging Branch
Pushing changes to *`master`* will cause the Heroku staging sever to update.
THe staing server is already provisioned with configured MLAb Mongo Heroku addon.

The heroku app websocket server should be available at:
wss://ceasar-server-staging.concord.org/ or

### Procution Branch
This is not configured yet, but will be configured similar to how the staging branch is configured.

## Project Structure

- `index.ts`: main entry point, register an empty room handler and attach [`@colyseus/monitor`](https://github.com/colyseus/colyseus-monitor)
- `MyRoom.ts`: an empty room handler for you to implement your logic
- `loadtest/example.ts`: scriptable client for the loadtest tool (see `npm run loadtest`)
- `package.json`:
    - `scripts`:
        - `npm live`: runs `ts-node index.ts`
        - `npm run loadtest`: runs the [`@colyseus/loadtest`](https://github.com/colyseus/colyseus-loadtest/) tool for testing the connection, using the `loadtest/example.ts` script.
    - `dependencies`:
        - `colyseus`
        - `@colyseus/monitor`
        - `express`
        - `dotenv`
    - `devDependencies`
        - `ts-node`
        - `typescript`
        - `@colyseus/loadtest`
        - `rimraf`
- `tsconfig.json`: TypeScript configuration file


## License

MIT
