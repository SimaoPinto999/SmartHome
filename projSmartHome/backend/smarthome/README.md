## Run locally with docker

1. build:
   `docker build -t smarthome-backend .`

2. run:
   `docker run -d -p 8081:8081 --name smarthome-api smarthome-backend`