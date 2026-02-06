#!/bin/bash

# QA Agent - API & Integration Tests
# Tests all API endpoints against the live demo site

set -uo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

BASE_URL="${1:-https://workflow.mikedeez.top}"
PASS_COUNT=0
FAIL_COUNT=0

echo "🚀 Running QA Agent against: $BASE_URL"
echo "================================================"
echo ""

# Test helper function
test_endpoint() {
    local method="$1"
    local path="$2"
    local description="$3"
    local data="${4:-}"
    local expect_status="${5:-200}"

    echo -n "Testing: $description ... "

    if [ "$method" = "GET" ]; then
        response=$(curl -s -w "\n%{http_code}" --max-time 10 "$BASE_URL$path" 2>&1 || echo -e "\nERROR")
    else
        response=$(curl -s -w "\n%{http_code}" --max-time 10 -X "$method" \
            -H "Content-Type: application/json" \
            -d "$data" \
            "$BASE_URL$path" 2>&1 || echo -e "\nERROR")
    fi

    status=$(echo "$response" | tail -n1)
    body=$(echo "$response" | head -n-1)

    if [ "$status" = "$expect_status" ]; then
        echo -e "${GREEN}[PASS]${NC} (HTTP $status)"
        ((PASS_COUNT++))
        return 0
    else
        echo -e "${RED}[FAIL]${NC} (HTTP $status, expected $expect_status)"
        echo "Response: $body"
        ((FAIL_COUNT++))
        return 1
    fi
}

# Test with JSON validation
test_json_endpoint() {
    local method="$1"
    local path="$2"
    local description="$3"
    local jq_filter="$4"
    local data="${5:-}"

    echo -n "Testing: $description ... "

    if [ "$method" = "GET" ]; then
        response=$(curl -s -w "\n%{http_code}" --max-time 10 "$BASE_URL$path" 2>&1 || echo -e "\nERROR")
    else
        response=$(curl -s -w "\n%{http_code}" --max-time 10 -X "$method" \
            -H "Content-Type: application/json" \
            -d "$data" \
            "$BASE_URL$path" 2>&1 || echo -e "\nERROR")
    fi

    status=$(echo "$response" | tail -n1)
    body=$(echo "$response" | head -n-1)

    if [ "$status" != "200" ]; then
        echo -e "${RED}[FAIL]${NC} (HTTP $status)"
        echo "Response: $body"
        ((FAIL_COUNT++))
        return 1
    fi

    # Validate JSON structure
    if echo "$body" | jq -e "$jq_filter" > /dev/null 2>&1; then
        echo -e "${GREEN}[PASS]${NC}"
        ((PASS_COUNT++))
        return 0
    else
        echo -e "${RED}[FAIL]${NC} (JSON validation failed)"
        echo "Response: $body"
        ((FAIL_COUNT++))
        return 1
    fi
}

echo "📋 GET Endpoint Tests"
echo "-------------------"

# Skip /api/settings/env in demo mode (returns 403)
echo -n "Testing: GET /api/settings/env - Environment settings ... "
echo -e "${YELLOW}[SKIP]${NC} (disabled in demo mode)"

test_json_endpoint "GET" "/api/agents" \
    "GET /api/agents - List agents" \
    '.agents | type == "array"'

test_json_endpoint "GET" "/api/agents/tasks" \
    "GET /api/agents/tasks - List tasks" \
    '.tasks | type == "array"'

test_json_endpoint "GET" "/api/memory/stats" \
    "GET /api/memory/stats - Memory statistics" \
    '.totalEntries'

test_json_endpoint "GET" "/api/memory?type=fact" \
    "GET /api/memory?type=fact - Facts memory" \
    '.memories | type == "array"'

test_json_endpoint "GET" "/api/memory/search?q=authentication" \
    "GET /api/memory/search?q=authentication - Search memory" \
    '.results | type == "array"'

test_json_endpoint "GET" "/api/mcp/servers" \
    "GET /api/mcp/servers - MCP servers" \
    '.servers | type == "array"'

test_json_endpoint "GET" "/api/mcp/tools" \
    "GET /api/mcp/tools - MCP tools" \
    '.tools | type == "array"'

echo ""
echo "📝 POST Endpoint Tests"
echo "-------------------"

test_json_endpoint "POST" "/api/vibe/generate" \
    "POST /api/vibe/generate (claude)" \
    '.nodes | type == "array"' \
    '{"provider":"claude","description":"Create a test function","style":"functional"}'

test_json_endpoint "POST" "/api/vibe/generate" \
    "POST /api/vibe/generate (gemini)" \
    '.nodes | type == "array"' \
    '{"provider":"gemini","description":"Create a test function","style":"functional"}'

test_json_endpoint "POST" "/api/builder/export" \
    "POST /api/builder/export - Export workflow" \
    '.yaml' \
    '{"nodes":[{"id":"1","type":"custom","data":{"label":"Test","type":"start"},"position":{"x":0,"y":0}}],"edges":[]}'

# Store export for import test
export_response=$(curl -s --max-time 10 -X POST \
    -H "Content-Type: application/json" \
    -d '{"nodes":[{"id":"1","type":"custom","data":{"label":"Test","type":"start"},"position":{"x":0,"y":0}}],"edges":[]}' \
    "$BASE_URL/api/builder/export")

test_json_endpoint "POST" "/api/builder/import" \
    "POST /api/builder/import - Import workflow" \
    '.nodes | type == "array"' \
    "$export_response"

test_json_endpoint "POST" "/api/suggestions/analyze" \
    "POST /api/suggestions/analyze - Analyze code" \
    '.suggestions | type == "array"' \
    '{"nodes":[{"id":"1","type":"start"}],"edges":[]}'

echo ""
echo "🔄 Integration Flow Tests"
echo "------------------------"

# Test 1: Builder export → import round-trip
echo -n "Testing: Builder export → import round-trip ... "
export_data=$(curl -s --max-time 10 -X POST \
    -H "Content-Type: application/json" \
    -d '{"nodes":[{"id":"1","type":"custom","data":{"label":"Test","type":"start"},"position":{"x":0,"y":0}}],"edges":[]}' \
    "$BASE_URL/api/builder/export")

export_has_yaml=$(echo "$export_data" | jq -e '.yaml' > /dev/null 2>&1 && echo "yes" || echo "no")

import_response=$(curl -s -w "\n%{http_code}" --max-time 10 -X POST \
    -H "Content-Type: application/json" \
    -d "$export_data" \
    "$BASE_URL/api/builder/import")

import_status=$(echo "$import_response" | tail -n1)
import_body=$(echo "$import_response" | head -n-1)

if [ "$export_has_yaml" = "yes" ] && [ "$import_status" = "200" ] && echo "$import_body" | jq -e '.nodes | type == "array"' > /dev/null 2>&1; then
    echo -e "${GREEN}[PASS]${NC} (round-trip successful)"
    ((PASS_COUNT++))
else
    echo -e "${RED}[FAIL]${NC} (export: $export_has_yaml, import: $import_status)"
    ((FAIL_COUNT++))
fi

# Test 2: Memory type query returns entries
echo -n "Testing: Memory type query returns entries ... "
memory_response=$(curl -s --max-time 10 "$BASE_URL/api/memory?type=fact")
memory_count=$(echo "$memory_response" | jq '.memories | length')

if [ "$memory_count" -gt 0 ]; then
    echo -e "${GREEN}[PASS]${NC} ($memory_count facts)"
    ((PASS_COUNT++))
else
    echo -e "${RED}[FAIL]${NC} (no facts found)"
    ((FAIL_COUNT++))
fi

# Test 3: Dual vibe provider support
echo -n "Testing: Dual vibe provider support ... "
claude_vibe=$(curl -s --max-time 10 -X POST \
    -H "Content-Type: application/json" \
    -d '{"provider":"claude","description":"Create a test function","style":"functional"}' \
    "$BASE_URL/api/vibe/generate")
gemini_vibe=$(curl -s --max-time 10 -X POST \
    -H "Content-Type: application/json" \
    -d '{"provider":"gemini","description":"Create a test function","style":"functional"}' \
    "$BASE_URL/api/vibe/generate")

claude_has_nodes=$(echo "$claude_vibe" | jq -e '.nodes | type == "array"' > /dev/null 2>&1 && echo "yes" || echo "no")
gemini_has_nodes=$(echo "$gemini_vibe" | jq -e '.nodes | type == "array"' > /dev/null 2>&1 && echo "yes" || echo "no")

if [ "$claude_has_nodes" = "yes" ] && [ "$gemini_has_nodes" = "yes" ]; then
    echo -e "${GREEN}[PASS]${NC} (both providers work)"
    ((PASS_COUNT++))
else
    echo -e "${RED}[FAIL]${NC} (claude: $claude_has_nodes, gemini: $gemini_has_nodes)"
    ((FAIL_COUNT++))
fi

echo ""
echo "================================================"
echo "📊 Test Results"
echo "================================================"
echo -e "${GREEN}Passed: $PASS_COUNT${NC}"
echo -e "${RED}Failed: $FAIL_COUNT${NC}"
echo ""

if [ "$FAIL_COUNT" -eq 0 ]; then
    echo -e "${GREEN}✅ All tests passed!${NC}"
    exit 0
else
    echo -e "${RED}❌ Some tests failed${NC}"
    exit 1
fi
