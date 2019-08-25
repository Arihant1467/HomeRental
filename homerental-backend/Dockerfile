FROM node:10.15-alpine
WORKDIR /usr/src/app

RUN apk --no-cache add --virtual native-deps \
  g++ gcc libgcc libstdc++ linux-headers autoconf automake make nasm python git && \
  npm install --quiet node-gyp -g

COPY . .
ENV MONGODB_HOST="localhost"
ENV MONGODB_PORT="27017"
ENV AUTHENTICATING_DATABASE="admin"


RUN npm install

EXPOSE 3500

ADD https://github.com/ufoscout/docker-compose-wait/releases/download/2.2.1/wait /wait
RUN chmod +x /wait

CMD /wait && npm start