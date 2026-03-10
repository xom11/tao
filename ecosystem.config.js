const path = require('path')
const ROOT = __dirname

module.exports = {
  apps: [
    {
      name: 'api',
      namespace: 'tao',
      script: 'uv',
      args: 'run uvicorn api.main:app --host 0.0.0.0 --port 8000',
      cwd: ROOT,
      interpreter: 'none',
      autorestart: true,
      watch: false,
    },
    {
      name: 'scheduler',
      namespace: 'tao',
      script: 'uv',
      args: 'run python -m tao.main',
      cwd: ROOT,
      interpreter: 'none',
      autorestart: true,
      watch: false,
    },
    {
      name: 'web',
      namespace: 'tao',
      script: 'npm',
      args: 'start',
      cwd: path.join(ROOT, 'web'),
      interpreter: 'none',
      env: { PORT: 3000 },
      autorestart: true,
      watch: false,
    },
  ],
}
