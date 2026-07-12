#!/bin/bash

# E2E Test Runner Script
# Ensures dev server is running and executes tests safely

set -e

echo "🧪 PolicyAi E2E Test Runner"
echo "================================================"
echo ""

# Check if dev server is running
check_server() {
    local port=$1
    if curl -s http://localhost:$port > /dev/null 2>&1; then
        return 0
    else
        return 1
    fi
}

# Find available port
PORT=3000
while check_server $PORT && [ $PORT -lt 3010 ]; do
    PORT=$((PORT + 1))
done

echo "📋 Pre-flight Checks:"
echo "  - Node modules: $([ -d node_modules ] && echo '✅' || echo '❌ Run npm install')"
echo "  - Test config: $([ -f .env.test ] && echo '✅' || echo '❌ Missing .env.test')"
echo "  - Playwright: $([ -d node_modules/@playwright ] && echo '✅' || echo '❌ Run npm install -D @playwright/test')"
echo ""

# Check if test users exist
if [ -f .env.test ]; then
    source .env.test
    echo "📝 Test Users Configured:"
    echo "  - Admin: $TEST_ADMIN_EMAIL"
    echo "  - Employee: $TEST_EMPLOYEE_EMAIL"
else
    echo "⚠️  Warning: .env.test not found. Tests may fail."
    echo "   Run: node tests/setup-test-users.js"
fi
echo ""

# Check for running dev server
echo "🔍 Checking for dev server..."
if check_server 3000; then
    echo "  ✅ Found server on port 3000"
    TEST_PORT=3000
elif check_server 3005; then
    echo "  ✅ Found server on port 3005"
    TEST_PORT=3005
else
    echo "  ❌ No dev server found on ports 3000-3005"
    echo ""
    read -p "Start dev server now? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo "  🚀 Starting dev server..."
        npm run dev > /tmp/policyai-dev-server.log 2>&1 &
        DEV_SERVER_PID=$!
        echo "  ⏳ Waiting for server to start..."
        sleep 5
        
        # Check which port it started on
        for p in 3000 3001 3002 3003 3004 3005; do
            if check_server $p; then
                TEST_PORT=$p
                echo "  ✅ Server started on port $p"
                break
            fi
        done
        
        if [ -z "$TEST_PORT" ]; then
            echo "  ❌ Server failed to start. Check /tmp/policyai-dev-server.log"
            exit 1
        fi
    else
        echo "  ℹ️  Start dev server manually: npm run dev"
        exit 1
    fi
fi
echo ""

# Update BASE_URL in .env.test if needed
if [ -f .env.test ]; then
    current_url=$(grep "^BASE_URL=" .env.test | cut -d= -f2)
    expected_url="http://localhost:$TEST_PORT"
    
    if [ "$current_url" != "$expected_url" ]; then
        echo "📝 Updating BASE_URL in .env.test to port $TEST_PORT..."
        sed -i.bak "s|^BASE_URL=.*|BASE_URL=$expected_url|" .env.test
        rm -f .env.test.bak
    fi
fi

echo "🧪 Running Tests..."
echo "================================================"
echo ""

# Run tests based on argument
case "${1:-all}" in
    quick)
        echo "⚡ Running quick tests (auth only)..."
        npx playwright test auth.spec.ts --reporter=list
        ;;
    auth)
        echo "🔐 Running authentication tests..."
        npx playwright test auth.spec.ts --reporter=html,list
        ;;
    employee)
        echo "👤 Running employee tests..."
        npx playwright test employee-chat.spec.ts --reporter=html,list
        ;;
    admin)
        echo "👨‍💼 Running admin tests..."
        npx playwright test admin.spec.ts --reporter=html,list
        ;;
    scenarios)
        echo "🎬 Running scenario tests..."
        npx playwright test scenarios.spec.ts --reporter=html,list
        ;;
    integration)
        echo "🔗 Running integration tests..."
        npx playwright test integration.spec.ts --reporter=html,list
        ;;
    performance)
        echo "⚡ Running performance tests..."
        npx playwright test performance.spec.ts --reporter=html,list
        ;;
    basic)
        echo "📋 Running basic test suite..."
        npx playwright test auth.spec.ts employee-chat.spec.ts admin.spec.ts --reporter=html,list
        ;;
    all)
        echo "🎯 Running full test suite..."
        npx playwright test --reporter=html,list
        ;;
    ui)
        echo "🖥️  Opening interactive UI..."
        npx playwright test --ui
        ;;
    *)
        echo "Usage: $0 [quick|auth|employee|admin|scenarios|integration|performance|basic|all|ui]"
        echo ""
        echo "Examples:"
        echo "  $0 quick      # Fast smoke test (auth only)"
        echo "  $0 auth       # Authentication tests"
        echo "  $0 basic      # Auth + Employee + Admin"
        echo "  $0 all        # Full test suite"
        echo "  $0 ui         # Interactive mode"
        exit 1
        ;;
esac

echo ""
echo "================================================"
echo "✨ Test run complete!"
echo ""
echo "📊 View HTML report: npm run test:report"
echo "📁 Screenshots/videos: test-results/"
echo ""

# Cleanup if we started the server
if [ ! -z "$DEV_SERVER_PID" ]; then
    echo "🛑 Stopping dev server (PID: $DEV_SERVER_PID)..."
    kill $DEV_SERVER_PID 2>/dev/null || true
fi
