const { execSync } = require('child_process');

console.log("Running database migrations...");
try {
  // Explicitly run the prisma CLI using node to avoid shell syntax issues
  execSync('node node_modules/prisma/build/index.js migrate deploy', { stdio: 'inherit' });
  
  console.log("Migrations complete. Starting server...");
  // Load the compiled server entry point
  require('./dist/server.js');
} catch (error) {
  console.error("Failed to start application:", error);
  process.exit(1);
}
