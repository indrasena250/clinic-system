// Demo cleanup script - run this periodically (e.g., via cron job)
const { cleanupExpiredDemos } = require("./controllers/demoController");
const db = require("./config/db");

async function runCleanup() {
  console.log("Starting demo cleanup...");
  try {
    await cleanupExpiredDemos();
    console.log("Demo cleanup completed successfully");
  } catch (error) {
    console.error("Demo cleanup failed:", error);
  } finally {
    process.exit(0);
  }
}

// Run cleanup if called directly
if (require.main === module) {
  runCleanup();
}

module.exports = { runCleanup };