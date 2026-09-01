FROM node:20-alpine AS builder

# Permite inyectar la URL del API en tiempo de build
ARG VITE_API_URL=""
ENV VITE_API_URL=$VITE_API_URL

WORKDIR /app
COPY package.json .
RUN npm install
COPY . .
RUN npm run build

# Etapa de producción con Nginx
FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
