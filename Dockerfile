# Blog Automation - Static Site Container
FROM nginx:alpine

# Copy static files
COPY . /usr/share/nginx/html/

# Copy nginx configuration
COPY nginx/default.conf /etc/nginx/conf.d/default.conf

# Remove unnecessary files from html directory
RUN rm -rf /usr/share/nginx/html/nginx \
    && rm -f /usr/share/nginx/html/Dockerfile \
    && rm -rf /usr/share/nginx/html/.git \
    && rm -rf /usr/share/nginx/html/.claude

# Expose port
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost/health || exit 1

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
