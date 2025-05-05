FROM mcr.microsoft.com/devcontainers/javascript-node:18

RUN npm install -g @angular/cli
RUN npm install -g nx
RUN apt-get update && apt-get install -y git

RUN apt-get update \
  && apt-get install -y --no-install-recommends \
    locales \
    locales-all \
    libcap-dev \
 && rm -rf /var/lib/apt/lists/*
RUN apt-get update && apt-get install -y poppler-utils poppler-data

# Set the locale
ENV LANG=en_US.UTF-8
ENV LANGUAGE=en_US:en
ENV LC_ALL=en_US.UTF-8

COPY default.cf /usr/local/etc/isolate

RUN npm i -g npm@9.9.3
RUN npm i -g pnpm@9.15.0
RUN npm i -g cross-env@7.0.3

RUN pnpm config set store-dir /root/.local/share/pnpm/store

# Update to use Node.js 20 packages
RUN pnpm store add @tsconfig/node20@20.1.4
RUN pnpm store add @types/node@20.14.8
RUN pnpm store add typescript@4.9.4

ADD .. /app

WORKDIR /app

ENTRYPOINT [ "./docker-entrypoint.sh" ]
