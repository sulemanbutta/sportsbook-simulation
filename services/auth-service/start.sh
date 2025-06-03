#!/bin/bash
set -e

echo "🚀 Starting auth service container..."

# Function to check if proxy is ready
check_proxy_ready() {
    timeout 2 bash -c 'cat < /dev/null > /dev/tcp/127.0.0.1/5432' 2>/dev/null
}

# Check if we should start Cloud SQL Proxy
if [ ! -z "$K_SERVICE" ] && [ ! -z "$CLOUDSQL_INSTANCES" ]; then
    echo "🔗 Cloud Run detected - starting Cloud SQL Proxy"
    echo "📋 Instance: $CLOUDSQL_INSTANCES"
    echo "📋 Service Account: $GOOGLE_APPLICATION_CREDENTIALS"
    
    # Start Cloud SQL Proxy in background
    echo "▶️ Starting Cloud SQL Proxy..."
    /usr/local/bin/cloud_sql_proxy \
        -instances=$CLOUDSQL_INSTANCES=tcp:0.0.0.0:5432 \
        -verbose &
    
    PROXY_PID=$!
    echo "✅ Cloud SQL Proxy started with PID: $PROXY_PID"
    
    # Wait for proxy to be ready (up to 30 seconds)
    echo "⏳ Waiting for proxy to be ready..."
    for i in {1..30}; do
        if check_proxy_ready; then
            echo "✅ Cloud SQL Proxy is ready!"
            break
        fi
        
        if [ $i -eq 30 ]; then
            echo "❌ Proxy not ready after 30 seconds, checking status..."
            echo "📋 Proxy process status:"
            ps aux | grep cloud_sql_proxy | grep -v grep || echo "No proxy process found"
            echo "📋 Network status:"
            netstat -tuln 2>/dev/null | grep 5432 || echo "Port 5432 not listening"
            echo "⚠️ Continuing anyway - app will try to connect"
        else
            echo "⏳ Attempt $i/30..."
            sleep 1
        fi
    done
else
    echo "🏠 Local development - no Cloud SQL Proxy needed"
fi

# Start the Node.js application
echo "🚀 Starting Node.js application..."
exec npm start