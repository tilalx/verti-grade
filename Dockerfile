# --------------> The build image
FROM node:22 as frontend-build
WORKDIR /app/frontend

COPY frontend/package.json frontend/yarn.lock .yarnrc.yml ./

RUN corepack enable  && yarn set version berry && yarn install

COPY frontend ./

RUN yarn build

# --------------> The final stage
FROM node:22
WORKDIR /app

# Copy the build output and other necessary files from the frontend build stage
COPY --from=frontend-build /app/frontend/.output /app/nuxt

EXPOSE 3000

CMD ["node", "nuxt/server/index.mjs"]