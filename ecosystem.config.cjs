module.exports = {
  apps: [
    {
      name: "agrodesk-backend",
      cwd: "./backend",
      script: "npm",
      args: "run start",
      env: {
        NODE_ENV: "production",
      },
    },
    {
      name: "agrodesk-frontend",
      cwd: ".",
      script: "npm",
      args: "run preview -- --host 0.0.0.0 --port 8080",
      env: {
        NODE_ENV: "production",
      },
    },
  ],
};
