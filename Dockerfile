FROM node:16.13.1 AS app
COPY . .
RUN npm install
ENTRYPOINT["node", "javascriptVersions/advanced.js"]
