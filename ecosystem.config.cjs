module.exports = {
  apps: [
    {
      name: "nextjs-app",
      script: "npm",
      args: "start",
    },
    {
      name: "worker",
      script: "worker.js",
      instances: 1,
      env: {
        SUPABASE_URL: "https://huzzdveynwzcrpmzltrf.supabase.co",
        SUPABASE_SERVICE_ROLE_KEY: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh1enpkdmV5bnd6Y3JwbXpsdHJmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDA2ODYwMiwiZXhwIjoyMDg5NjQ0NjAyfQ.hmxwkfEU_DN84UVFqg4eLT4-ipK40DsHH9V-EwpGrpg"
      }
    }
  ]
}
