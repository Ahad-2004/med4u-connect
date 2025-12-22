// Environment validation - Add at top of backend/index.js after dotenv.config()
function validateEnvironment() {
  const required = ['JWT_SECRET'];
  const missing = required.filter(key => !process.env[key]);
  
  if (missing.length > 0) {
    console.error('[FATAL] Missing required environment variables:', missing.join(', '));
    console.error('[FATAL] Please set these environment variables and restart the server');
    process.exit(1);
  }
  
  // Validate JWT_SECRET is sufficiently strong
  if (process.env.JWT_SECRET.length < 32) {
    console.error('[FATAL] JWT_SECRET must be at least 32 characters long for security');
    process.exit(1);
  }
  
  console.log('[ENV] All required environment variables validated');
}

validateEnvironment();
