# Petlibro MCP Server

This server offers tools enabling AI interactions with Petlibro smart feeder and fountain
products. Check feeding schedules and history, emit food, and more.

This project is only a proof-of-concept. Owners looking to automate their
Petlibro devices should likely use the [Home Assistant MCP
server](https://www.home-assistant.io/integrations/mcp_server/) and [petlibro
integration](https://github.com/jjjonesjr33/petlibro) for a more complete and
better supported experience.

## Getting Started

Set your MD5 hashed Petlibro password and start the server:

```sh
export MD5_PASS=$(echo -n "your_password" | md5sum | cut -d' ' -f1)
docker compose up
```

Then connect your client to the server at `http://your.host:3000/mcp`. At this
time there is no further authentication, but in some clients it may be necessary
to select an `Authorization:` header with a fake value.

## Development

Use the dev script to run tsx and watch for changes:

```sh
docker compose run --rm -e MD5_PASS -p 3000:3000 \
  -v "$PWD:/app" -v "/app/petlibro-client" \
  app sh -c "npm install && npm run dev"
```

### Generate API Client

This project uses client code generated from OpenAPI spec. The client is built
into the `app` service's image. The spec is fetched directly from URL which
isn't ideal - maybe in the future it should have its version pinned or output
committed.

```sh
docker run -v ${PWD}/petlibro-client:/local --rm openapitools/openapi-generator-cli generate \
  --package-name petlibro-client \
  --additional-properties=npmName=petlibro-client \
  -i https://christianprescott.com/petlibro/docs/api/petlibro/openapi.yaml \
  -g typescript \
  -o /local/
```
