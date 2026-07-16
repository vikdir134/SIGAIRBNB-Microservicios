FROM node:20-alpine AS build

WORKDIR /app

ARG VITE_API_URL=/api
ARG VITE_DEMO_EMAIL=jorge.chavezg@unmsm.edu.pe
ARG VITE_DEMO_PASSWORD=J0rge1201

ENV VITE_API_URL=${VITE_API_URL}
ENV VITE_DEMO_EMAIL=${VITE_DEMO_EMAIL}
ENV VITE_DEMO_PASSWORD=${VITE_DEMO_PASSWORD}

COPY package*.json ./

RUN npm ci

COPY . .

RUN npm run build

FROM nginx:1.27-alpine

COPY nginx.conf /etc/nginx/conf.d/default.conf

COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
