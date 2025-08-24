#!/bin/bash
# test-all-connections.sh
# Test all PostgreSQL database connections with password 'peter435'

echo "🧪 Testing all database connections with password 'peter435'..."
echo "=================================================================="

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Counter for success/failure
TOTAL_TESTS=0
SUCCESSFUL_TESTS=0
FAILED_TESTS=0

# Function to test database connection
test_db_connection() {
    local service_name=$1
    local username=$2
    local port=$3
    local database=$4
    
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    
    echo -n "Testing ${service_name} (${username}@localhost:${port}/${database})... "
    
    # Test connection and get user/database info
    result=$(psql postgresql://${username}:peter435@localhost:${port}/${database} \
             -c "SELECT current_user, current_database();" \
             -t -A -F'|' 2>/dev/null)
    
    if [ $? -eq 0 ] && [ ! -z "$result" ]; then
        current_user=$(echo $result | cut -d'|' -f1)
        current_db=$(echo $result | cut -d'|' -f2)
        echo -e "${GREEN}✅ SUCCESS${NC}"
        echo -e "   ${BLUE}User:${NC} ${current_user} | ${BLUE}Database:${NC} ${current_db}"
        SUCCESSFUL_TESTS=$((SUCCESSFUL_TESTS + 1))
    else
        echo -e "${RED}❌ FAILED${NC}"
        echo -e "   ${RED}Error: Could not connect or authenticate${NC}"
        FAILED_TESTS=$((FAILED_TESTS + 1))
    fi
    echo
}

# Function to test Redis connection
test_redis_connection() {
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    
    echo -n "Testing Redis (localhost:6379)... "
    
    result=$(redis-cli -h localhost -p 6379 ping 2>/dev/null)
    
    if [ "$result" = "PONG" ]; then
        echo -e "${GREEN}✅ SUCCESS${NC}"
        echo -e "   ${BLUE}Response:${NC} $result"
        SUCCESSFUL_TESTS=$((SUCCESSFUL_TESTS + 1))
    else
        echo -e "${RED}❌ FAILED${NC}"
        echo -e "   ${RED}Error: No response from Redis${NC}"
        FAILED_TESTS=$((FAILED_TESTS + 1))
    fi
    echo
}

# Function to test Elasticsearch connection
test_elasticsearch_connection() {
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    
    echo -n "Testing Elasticsearch (localhost:9200)... "
    
    result=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:9200/_cluster/health 2>/dev/null)
    
    if [ "$result" = "200" ]; then
        echo -e "${GREEN}✅ SUCCESS${NC}"
        echo -e "   ${BLUE}HTTP Status:${NC} $result"
        SUCCESSFUL_TESTS=$((SUCCESSFUL_TESTS + 1))
    else
        echo -e "${RED}❌ FAILED${NC}"
        echo -e "   ${RED}Error: HTTP Status $result${NC}"
        FAILED_TESTS=$((FAILED_TESTS + 1))
    fi
    echo
}

# Check prerequisites
echo "🔍 Checking prerequisites..."
echo "================================"

# Check if psql is installed
if ! command -v psql &> /dev/null; then
    echo -e "${RED}❌ psql is not installed${NC}"
    echo "   Install with: sudo apt install postgresql-client"
    exit 1
else
    echo -e "${GREEN}✅ psql is available${NC}"
fi

# Check if redis-cli is installed
if ! command -v redis-cli &> /dev/null; then
    echo -e "${YELLOW}⚠️  redis-cli is not installed${NC}"
    echo "   Install with: sudo apt install redis-tools"
else
    echo -e "${GREEN}✅ redis-cli is available${NC}"
fi

# Check if curl is installed
if ! command -v curl &> /dev/null; then
    echo -e "${YELLOW}⚠️  curl is not installed${NC}"
    echo "   Install with: sudo apt install curl"
else
    echo -e "${GREEN}✅ curl is available${NC}"
fi

echo
echo "🗄️  Testing PostgreSQL Databases..."
echo "===================================="

# Test all database connections
test_db_connection "User Service" "user_service_user" "5432" "user_service_db"
test_db_connection "Post Service" "post_service_user" "5433" "post_service_db"
test_db_connection "Comment Service" "comment_service_user" "5434" "comment_service_db"
test_db_connection "Chat Service" "chat_service_user" "5435" "chat_service_db"
test_db_connection "Media Service" "media_service_user" "5436" "media_service_db"
test_db_connection "Notification Service" "notification_service_user" "5437" "notification_service_db"
test_db_connection "Analytics Service" "analytics_service_user" "5438" "analytics_service_db"
test_db_connection "Search Service" "search_service_user" "5439" "search_service_db"

echo "🔄 Testing Other Services..."
echo "============================"

# Test Redis
if command -v redis-cli &> /dev/null; then
    test_redis_connection
else
    echo "Skipping Redis test (redis-cli not available)"
    echo
fi

# Test Elasticsearch
if command -v curl &> /dev/null; then
    test_elasticsearch_connection
else
    echo "Skipping Elasticsearch test (curl not available)"
    echo
fi

# Summary
echo "📊 Test Summary"
echo "==============="
echo -e "Total tests: ${BLUE}${TOTAL_TESTS}${NC}"
echo -e "Successful: ${GREEN}${SUCCESSFUL_TESTS}${NC}"
echo -e "Failed: ${RED}${FAILED_TESTS}${NC}"

if [ $FAILED_TESTS -eq 0 ]; then
    echo -e "\n🎉 ${GREEN}All tests passed! Your database setup is working perfectly.${NC}"
    exit 0
else
    echo -e "\n⚠️  ${YELLOW}Some tests failed. Check the errors above.${NC}"
    exit 1
fi
