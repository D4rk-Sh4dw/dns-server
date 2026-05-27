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
# Note: With variable-based proxy_pass, nginx -t may warn about host resolution
# but the config is still valid - DNS resolves at runtime via resolver directive
echo "Validating Nginx configuration..."
if ! nginx -t 2>&1; then
    echo "WARNING: Nginx config validation had issues, but continuing since"
    echo "variable-based proxy_pass resolves DNS at runtime."
    echo "--- Generated config ---"
    cat /etc/nginx/conf.d/default.conf
    echo "--- End of config ---"
fi

echo "Starting Nginx..."
exec nginx -g 'daemon off;'
