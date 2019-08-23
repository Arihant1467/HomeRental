# HomeRental
HomeRental is a dockerized MERN stack app which I developed towards my learning for Distributed systems and dockerization of web apps


### To launch the entire stack
This launches the services that make up the app so they can be run together in an isolated environment.
```
docker-compose up
```

### To down the entire stack
```
docker-compose down
```

### To launch them individually

- Create virtual docker network
  ```
  docker network create homeaway
  ```

- MongoDB
  ```
  docker run -d --name MONGODB_CONTAINER_NAME \
    --network=homeaway \
    -p 27017:27017
	-e MONGO_INITDB_ROOT_USERNAME=MONGODB_USERNAME \
    -e MONGO_INITDB_ROOT_PASSWORD=MONGODB_PASSWORD \
    mongo
  ```

- Backend
  ```
  docker run -d --name homerental-backend \
	--network=homeaway \
    -p 3500:3500 \
	-e MONGODB_USERNAME=USERNAME_OF_MONGODB \
	-e MONGODB_PASSWORD=PASSWORD_OF_MONGODB \
    -e MONGODB_HOST=HOSTNAME_WHERE_MONGODB_LISTENING \
    -e MONGODB_PORT=PORT_WHERE_MONGODB_LISTENING \
    -e AUTHENTICATING_DATABASE=DB_NAME_WHERE_CREDENTIALS_NEED_TO_AUTHENTICATE \
	homerental-backend
  ```

- Frontend
  ```
  docker run -d --name homerental-frontend \
    --network=homeaway \
    -p 3000:3000 \
    -e PROXY_BACKEND=ADDRESS&PORT_NUMBER_WHERE_YOUR_BACKEND_IS_LISTENING
    homerental-frontend
  ```
### Launch Your website
```
firefox http://HOST_NAME:3000
```
