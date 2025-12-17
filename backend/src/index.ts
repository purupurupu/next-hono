import { createApp } from "./lib/app";
import { getConfig } from "./lib/config";
import { closeDb } from "./lib/db";

const app = createApp({ enableLogger: true });

// Graceful shutdown
const shutdown = async () => {
  console.log("Shutting down...");
  await closeDb();
  process.exit(0);
};

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

// Start server
const config = getConfig();
console.log(`Server starting on port ${config.PORT}...`);

export default {
  port: config.PORT,
  fetch: app.fetch,
};
