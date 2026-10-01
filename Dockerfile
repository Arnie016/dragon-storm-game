FROM node:24-bookworm-slim
WORKDIR /app
COPY --chown=node:node . .
USER node
RUN mkdir -p .runtime
ENV NODE_ENV=production HOST=0.0.0.0 PORT=8000
EXPOSE 8000
CMD ["node", "backend/server.mjs"]
