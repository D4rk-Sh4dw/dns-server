#!/bin/sh
set -e

# Defined variables to substitute to avoid breaking $host and other Nginx vars
VARS='$ADGUARD_USER $ADGUARD_PASS $TECHNITIUM_USER $TECHNITIUM_PASSWORD'

echo "Starting Nginx with envsubst..."
envsubst "$VARS" < /etc/nginx/templates/default.conf.template > /etc/nginx/conf.d/default.conf

# Check if substitution worked
if grep -q '\${ADGUARD_USER}' /etc/nginx/conf.d/default.conf; then
    echo "ERROR: Substitution failed! Found literal \${ADGUARD_USER} in config."
    exit 1
fi

echo "Configuration generated successfully."

# Validate Nginx config before starting
echo "Validating Nginx configuration..."
nginx -t 2>&1 || {
    echo "ERROR: Nginx configuration is invalid!"
    echo "--- Generated config ---"
    cat /etc/nginx/conf.d/default.conf
    echo "--- End of config ---"
    exit 1
}

echo "Nginx configuration is valid."
exec nginx -g 'daemon off;'
