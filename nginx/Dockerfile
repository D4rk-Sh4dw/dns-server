FROM nginx:alpine

# Install envsubst (included in alpine)
RUN apk add --no-cache gettext

# Copy configuration and templates
COPY templates/default.conf.template /etc/nginx/templates/default.conf.template
COPY start.sh /start.sh

RUN chmod +x /start.sh

# Environment variables will be substituted by /start.sh
ENTRYPOINT ["/bin/sh", "/start.sh"]
