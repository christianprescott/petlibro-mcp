FROM openapitools/openapi-generator-cli AS client

RUN docker-entrypoint.sh generate \
  --package-name petlibro-client \
  --additional-properties=npmName=petlibro-client \
  -i https://christianprescott.com/petlibro/docs/api/petlibro/openapi.yaml \
  -g typescript \
  -o /local/

FROM node:24-alpine

WORKDIR /app

COPY --from=client /local ./petlibro-client
COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

CMD ["npm", "start"]
