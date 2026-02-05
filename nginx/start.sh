#!/bin/sh
set -e

# Defined variables to substitute to avoid breaking $host
VARS='$ADGUARD_USER $ADGUARD_PASS $TECHNITIUM_USER $TECHNITIUM_PASSWORD'

echo "Starting Nginx with envsubst..."
envsubst "$VARS" < /etc/nginx/templates/default.conf.template > /etc/nginx/conf.d/default.conf

# Check if substitution worked
if grep -q '\${ADGUARD_USER}' /etc/nginx/conf.d/default.conf; then
    echo "ERROR: Substitution failed! Found literal \${ADGUARD_USER} in config."
    exit 1
fi

echo "Configuration generated successfully."
exec nginx -g 'daemon off;'
