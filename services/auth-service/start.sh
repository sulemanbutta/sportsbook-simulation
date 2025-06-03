#!/bin/bash
set -e

echo "🚀 Starting auth service container..."

# Function to check if proxy is ready
check_proxy_ready() {
    timeout 2 bash -c 'cat < /dev/null > /dev/tcp/127.0.0.1/5432' 2>/dev/null
}

# Check if we should start Cloud SQL Proxy
if [ ! -z "$K_SERVICE" ] && [ ! -z "$CLOUDSQL_INSTANCES" ]; then
    echo "🔗 Cloud Run detected - starting Cloud SQL Proxy v2"
    echo "📋 Instance: $CLOUDSQL_INSTANCES"
    
    # Start Cloud SQL Proxy v2 (much better certificate handling)
    echo "▶️ Starting Cloud SQL Proxy v2..."
    /usr/local/bin/cloud-sql-proxy \
        --port 5432 \
        --address 0.0.0.0 \
        $CLOUDSQL_INSTANCES &
    
    PROXY_PID=$!
    echo "✅ Cloud SQL Proxy v2 started with PID: $PROXY_PID"
    
    # Wait for proxy to be ready
    echo "⏳ Waiting for proxy to be ready..."
    for i in {1..30}; do
        if check_proxy_ready; then
            echo "✅ Cloud SQL Proxy v2 is ready!"
            break
        fi
        
        if [ $i -eq 30 ]; then
            echo "❌ Proxy not ready after 30 seconds"
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