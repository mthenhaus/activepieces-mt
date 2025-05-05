FROM mcr.microsoft.com/devcontainers/javascript-node:18

SHELL ["/bin/bash", "-c"]

EXPOSE 3000
EXPOSE 4200
EXPOSE 5432

ADD . /app

WORKDIR /app

RUN npm ci

ENTRYPOINT ["npm", "start"]
