/**
 * PM2 production configuration — Oracle Always Free VM.
 *
 * Audit fixes encoded:
 *   B3:  instances:1 + exec_mode:'fork' to prevent cron duplicate execution
 *   B24: Run compiled JS (./dist/worker/index.js) instead of tsx in prod
 *   B25: scripts/deploy.sh handles atomic deploy (build → reload)
 *
 * Local dev: pnpm run worker:dev (tsx watch mode, no PM2)
 * Production: pnpm run build && pnpm run worker:start
 */
module.exports = {
  apps: [
    {
      name: 'freetierhunt-worker',
      script: './dist/worker/index.js',
      cwd: __dirname,
      instances: 1, // 🔴 B3: NEVER scale this — cron duplication risk
      exec_mode: 'fork',
      autorestart: true,
      watch: false,
      max_memory_restart: '512M',
      env: {
        NODE_ENV: 'production',
        TZ: 'UTC',
      },
      out_file: './logs/worker-out.log',
      error_file: './logs/worker-error.log',
      merge_logs: true,
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      kill_timeout: 10000, // 10s graceful shutdown
    },
  ],
};
