const { execSync } = require('child_process');

try {
  console.log('Installing dependencies with --legacy-peer-deps...');
  // Runs npm install and sends output directly to your current terminal
  execSync('npm install --legacy-peer-deps', { stdio: 'inherit' });

  console.log('Starting launch.js...');
  // Runs the launch script and sends output directly to your current terminal
  execSync('node launch.js', { stdio: 'inherit' });
} catch (error) {
  console.error('An error occurred during execution:', error.message);
  process.exit(1);
}
