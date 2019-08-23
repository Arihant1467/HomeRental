FROM node:10.15.1

WORKDIR /usr/src/app

COPY . .
ENV MONGODB_HOST="localhost"
ENV MONGODB_PORT="27017"
ENV AUTHENTICATING_DATABASE="admin"

RUN npm install

EXPOSE 3500

CMD ["npm", "start"]