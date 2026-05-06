FROM node:24-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

# TODO: second build stage with npm install --omit=dev
CMD ["npm", "start"]
