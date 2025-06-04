#!/bin/bash
set -e

echo "🚀 Starting auth service container..."

# Function to check if proxy is ready
check_proxy_ready() {
    timeout 2 bash -c 'cat < /dev/null > /dev/tcp/127.0.0.1/5432' 2>/dev/null
}

# Check if we should start Cloud SQL Proxy
if [ ! -z "$K_SERVICE" ] && [ ! -z "$CLOUDSQL_INSTANCES" ]; then
    echo "🔗 Cloud Run detected - starting Cloud SQL Proxy v1"
    echo "📋 Instance: $CLOUDSQL_INSTANCES"
    
    # Start Cloud SQL Proxy v1
    echo "▶️ Starting Cloud SQL Proxy v1..."
    /usr/local/bin/cloud-sql-proxy \
        -instances=$CLOUDSQL_INSTANCES=tcp:0.0.0.0:5432 \
        -term_timeout=30s \
        -verbose &
    
    PROXY_PID=$!
    echo "✅ Cloud SQL Proxy v1 started with PID: $PROXY_PID"
    
    # Wait longer for certificates to generate
    echo "⏳ Waiting for proxy to be ready (certificates may take 30-60 seconds)..."
    for i in {1..60}; do
        if check_proxy_ready; then
            echo "✅ Cloud SQL Proxy is ready!"
            break
        fi
        
        if [ $i -eq 60 ]; then
            echo "❌ Proxy not ready after 60 seconds"
            echo "⚠️ Continuing anyway - app will try to connect"
        else
            if [ $((i % 15)) -eq 0 ]; then
                echo "⏳ Still waiting... ($i/60) - certificates generating"
            fi
            sleep 1
        fi
    done
else
    echo "🏠 Local development - no Cloud SQL Proxy needed"
fi

# Start the Node.js application
echo "🚀 Starting Node.js application..."
exec npm start