# --------------> The build image
FROM node:22.3.0-bookworm as nuxt-build
WORKDIR /app/nuxt

COPY nuxt/package.json nuxt/yarn.lock .yarnrc.yml ./

RUN corepack enable  && yarn set version berry && yarn install

COPY nuxt ./

RUN yarn build

# --------------> The final stage
FROM node:22.3.0-bookworm-slim
WORKDIR /app

# Copy the build output and other necessary files from the nuxt build stage
COPY --from=nuxt-build /app/nuxt/.output /app/nuxt

EXPOSE 3000

CMD ["node", "nuxt/server/index.mjs"]