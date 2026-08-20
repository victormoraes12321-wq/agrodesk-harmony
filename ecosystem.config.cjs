module.exports = {
  apps: [
    {
      name: "agrodesk-backend",
      cwd: "./backend",
      script: "node",
      args: "dist/main.js",
      env: {
        NODE_ENV: "production",
        PORT: 3333,
      },
      autorestart: true,
      max_restarts: 10,
      restart_delay: 2000,
    },
    {
      name: "agrodesk-frontend",
      cwd: ".",
      script: "node_modules/vite/bin/vite.js",
      args: "preview --host 0.0.0.0 --port 3001",
      env: {
        NODE_ENV: "production",
      },
      autorestart: true,
      max_restarts: 10,
      restart_delay: 2000,
    },
  ],
};
