FROM node:15.3.0-buster

RUN mkdir -p /src
WORKDIR /src

COPY . .

RUN npm i

CMD ["npm", "run", "serve"]