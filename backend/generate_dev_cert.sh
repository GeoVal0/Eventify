#!/bin/sh
# Generates a self-signed TLS certificate for running the backend over
# HTTPS locally, matching the frontend's @vitejs/plugin-basic-ssl setup
# (see vite.config.js) - the assignment requires all interactions to be
# SSL/TLS encrypted, and this closes the loop on the backend side.
#
# Run once from the backend/ directory:
#   sh generate_dev_cert.sh
# Then start the server with:
#   uvicorn main:app --reload --ssl-keyfile key.pem --ssl-certfile cert.pem
#
# Not meant to be committed / shared - each machine should generate its
# own. key.pem and cert.pem are already covered by .gitignore.

openssl req -x509 -newkey rsa:2048 -nodes \
  -keyout key.pem -out cert.pem -days 365 \
  -subj "/CN=localhost"

echo
echo "Generated key.pem and cert.pem for localhost."
echo "Run the server with:"
echo "  uvicorn main:app --reload --ssl-keyfile key.pem --ssl-certfile cert.pem"
echo "Your browser will show a self-signed-certificate warning the first time - that's expected for local dev."
