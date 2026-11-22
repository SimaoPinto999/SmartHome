#build react
FROM node:20-alpine AS build
WORKDIR /app

#package.json + dependiencies
COPY package*.json ./
RUN apk add --no-cache python3 make g++
RUN npm install

#copy src and build
COPY . .
RUN npm run build

#serve nginx
FROM nginx:alpine
#copy assets to nginx html folder
COPY --from=build /app/dist /usr/share/nginx/html

#nginx config for react router

COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]