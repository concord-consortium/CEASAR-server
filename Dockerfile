FROM node:14-slim

WORKDIR /CEASAR-server

# Copy complete source so node_module mokey-patch source is available too (applies in npm run postinstall).
COPY . .

RUN npm ci
# It should be run automatically, but somehow it wasn't (maybe it depends on NPM version).
# This script applies monkey-patch to Colyseus server.
RUN npm run postinstall

EXPOSE 3000

CMD [ "npm", "run", "build-and-start" ]
