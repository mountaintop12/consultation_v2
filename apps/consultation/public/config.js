// This file is used to inject runtime configuration into the application.
// The values are replaced during the build process based on the environment variables defined in the Docker Compose file.
window.__RUNTIME_CONFIG__ =
{
  ENV: "production",
  DAPP_DEFINITION_ADDRESS: "",
  NETWORK_ID: "2",
  VOTE_COLLECTOR_URL: "http://localhost:3001"
};
