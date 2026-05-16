# Petlibro MCP Server

This server offers tools for interacting with Petlibro smart feeder and fountain
products.

Set your MD5 hashed password and start the server:

```sh
export MD5_PASS=$(echo -n "your_password" | md5sum | cut -d' ' -f1)
docker compose up
```

Then connect your client to the server at `http://your.host:3000/mcp`. At this
time there is no authentication, but in some clients it may be necessary to
select an `Authorization:` header with a fake value.

## Development

Use the dev script to run tsx and watch for changes:

```sh
docker compose run -e MD5_PASS -p 3000:3000 --rm app npm run dev
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
