FROM node:20-alpine AS build

WORKDIR /app

COPY package*.json ./

RUN npm install -g @angular/cli

RUN npm install

COPY . .

RUN chmod +x node_modules/.bin/ng

RUN npm run build -- --configuration production

FROM nginx:alpine

COPY --from=build /app/dist/invincible-game/browser /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]