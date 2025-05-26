FROM node:20

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm install 

COPY . .

RUN npm run build

RUN npm update

EXPOSE 8080

CMD ["npm", "start"]