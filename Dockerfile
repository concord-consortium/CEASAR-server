FROM node:10

WORKDIR /CEASAR-server
COPY package*.json ./

RUN npm install

COPY . .

EXPOSE 3000

CMD [ "npm", "run", "build-and-start" ]
