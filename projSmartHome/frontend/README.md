## Run locally with docker

1. build:
   `docker build -t smarthome-frontend .`

2. run:
   `docker run -d -p 8080:80 --name smarthome-app smarthome-frontend`