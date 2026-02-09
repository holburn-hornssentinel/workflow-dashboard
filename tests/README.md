# QA Test Agent

AI-powered automated testing for Workflow Dashboard using Playwright + Gemini Vision.

## Features

- **Browser Automation**: Playwright controls real Chromium browser
- **AI Validation**: Gemini Vision analyzes screenshots to verify UI correctness
- **Natural Language**: Describe tests in plain English
- **Drag & Drop**: Tests complex interactions like node dragging
- **Console Monitoring**: Detects JavaScript errors automatically
- **Security Checks**: Validates HTTP security headers
- **Screenshot Capture**: Visual record of every test
- **Video Recording**: Optional video capture of test runs

## Quick Start

```bash
# 1. Setup (one-time)
chmod +x tests/setup.sh
./tests/setup.sh

# 2. Run tests
python3 tests/qa_agent.py

# 3. View results
ls tests/screenshots/  # Test screenshots
```

## Test Suite

The agent runs these smoke tests automatically:

1. ✅ **Homepage loads** - Verifies dynamic agent count (not hardcoded "5")
2. ✅ **Security headers** - Checks X-Frame-Options, X-Content-Type-Options, etc.
3. ✅ **Tools page text** - Verifies "Model Context Protocol" (not "75+ tools")
4. ✅ **Settings toast** - Confirms Budget save shows toast (not alert)
5. ✅ **Builder label edit** - Tests node label editing persistence
6. ✅ **Builder 3D view** - Verifies 3D view loads without crash
7. ✅ **Workflow navigation** - Tests graph node click → wizard navigation
8. ✅ **Console errors** - Scans all major pages for JS errors

## Configuration

### Environment Variables

```bash
# Required (for AI validation)
export GEMINI_API_KEY=your_gemini_key_here

# Optional
export TEST_URL=http://192.168.1.197:3004  # Target URL
export HEADLESS=true                        # Run without browser window
export RECORD_VIDEO=true                    # Record test execution
```

### Run Modes

```bash
# Interactive (see browser)
python3 tests/qa_agent.py

# Headless (CI/CD)
HEADLESS=true python3 tests/qa_agent.py

# With video recording
RECORD_VIDEO=true python3 tests/qa_agent.py

# Different target
TEST_URL=https://your-production-url.com python3 tests/qa_agent.py
```

## Test Results

```
============================================================
🤖 QA Test Agent - Workflow Dashboard
============================================================
Target: http://192.168.1.197:3004
AI Validation: Enabled (Gemini)
Time: 2026-02-09 14:30:00
============================================================

✅ PASS | Homepage loads with dynamic agent count
    └─ Agent count: 5 Agents Available | AI: Homepage displays correctly
    📸 Screenshot saved: tests/screenshots/homepage_20260209_143001.png

✅ PASS | Security headers present
    └─ 3/3 headers correct
    x-frame-options: ✓ DENY
    x-content-type-options: ✓ nosniff
    referrer-policy: ✓ strict-origin-when-cross-origin

✅ PASS | Tools: Shows 'Model Context Protocol' (not '75+')
    └─ Old text present: False | New text: True

...

============================================================
📊 TEST SUMMARY
============================================================
Total:   8
Passed:  7 ✅
Failed:  0 ❌
Skipped: 1 ⚠️
Success Rate: 87.5%
============================================================
```

## How It Works

### 1. Browser Automation (Playwright)

```python
# Navigate to page
await page.goto(BASE_URL)

# Click elements
await page.click('button#submit')
await page.click('text=Save Changes')

# Drag and drop
await page.drag_and_drop('#source', '#target')

# Type text
await page.fill('input#email', 'test@example.com')
await page.keyboard.type('Hello')
```

### 2. AI Vision Validation (Gemini)

```python
# Take screenshot
screenshot = await page.screenshot()

# AI analyzes it
validation = await ai_validate(
    screenshot,
    "Homepage should show workflow cards and stats"
)

# Returns: {"passed": True, "reason": "All expected elements visible"}
```

### 3. AI Element Detection

```python
# AI finds element by description
element = await ai_find_element(
    "the blue Save button in the top right"
)

# Click it
await page.mouse.click(element['x'], element['y'])
```

## Advanced Usage

### Add New Tests

```python
async def test_my_feature(self):
    """Test: My new feature works"""
    test_name = "My Feature: Does something"
    try:
        await self.page.goto(f"{BASE_URL}/my-page")

        # Test logic here
        await self.click_element(text="My Button")

        # Take screenshot
        screenshot = await self.take_screenshot("my_feature")

        # AI validation
        if model:
            validation = await self.ai_validate(
                screenshot,
                "The success message should be visible"
            )
            await self.log_test(test_name, validation['passed'],
                              validation['reason'])
    except Exception as e:
        await self.log_test(test_name, False, str(e))
```

Then add to `run_all_tests()`:

```python
tests = [
    # ... existing tests
    self.test_my_feature,  # Add here
]
```

### Test Drag & Drop

```python
# Method 1: Built-in
await page.drag_and_drop('#source-node', '#drop-zone')

# Method 2: Manual (more reliable)
source = await page.locator('.draggable-card').first
target = await page.locator('.drop-target').first

source_box = await source.bounding_box()
target_box = await target.bounding_box()

await page.mouse.move(source_box['x'], source_box['y'])
await page.mouse.down()
await page.mouse.move(target_box['x'], target_box['y'], steps=10)
await page.mouse.up()
```

### Test Forms

```python
# Fill inputs
await page.fill('#email', 'test@example.com')
await page.fill('#password', 'secret123')

# Select dropdown
await page.select_option('select#country', 'US')

# Check checkbox
await page.check('#agree-terms')

# Submit
await page.click('button[type="submit"]')

# Wait for response
await page.wait_for_selector('.success-message')
```

### Test API Calls

```python
# Intercept network requests
requests = []
page.on('request', lambda req: requests.append(req.url))

# Trigger action
await page.click('#load-data')

# Wait for API call
await page.wait_for_response('**/api/data')

# Verify request made
assert any('/api/data' in url for url in requests)
```

### Mock API Responses

```python
# Mock successful response
await page.route('**/api/users', lambda route: route.fulfill(
    status=200,
    json={'users': [{'id': 1, 'name': 'Test'}]}
))

# Mock error
await page.route('**/api/save', lambda route: route.fulfill(
    status=500,
    json={'error': 'Server error'}
))

# Block resources (faster tests)
await page.route('**/*.{png,jpg}', lambda route: route.abort())
```

## CI/CD Integration

### GitHub Actions

```yaml
name: QA Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Set up Python
        uses: actions/setup-python@v4
        with:
          python-version: '3.11'

      - name: Install dependencies
        run: |
          pip install -r tests/requirements.txt
          playwright install --with-deps chromium

      - name: Run QA tests
        env:
          GEMINI_API_KEY: ${{ secrets.GEMINI_API_KEY }}
          HEADLESS: true
        run: python3 tests/qa_agent.py

      - name: Upload screenshots
        if: always()
        uses: actions/upload-artifact@v3
        with:
          name: test-screenshots
          path: tests/screenshots/
```

## Troubleshooting

### "Playwright not installed"
```bash
playwright install chromium
```

### "GEMINI_API_KEY not set"
AI validation will be skipped but tests still run with basic assertions.

### "Element not found"
- Check if page is fully loaded: `await page.wait_for_load_state('networkidle')`
- Increase timeout: `await page.click(selector, timeout=10000)`
- Use AI to find it: `await ai_find_element("the save button")`

### Tests fail on CI but pass locally
- Set `HEADLESS=true` locally to replicate CI environment
- Check viewport size matches: `viewport={'width': 1920, 'height': 1080}`
- Add waits: `await asyncio.sleep(1)` after page loads

## Cost

- **Playwright**: Free and open source
- **Gemini 2.5 Flash**: ~$0.50 per 1000 test runs (with screenshots)
- **Total**: Effectively free for most testing needs

## Extending the Agent

See the conversation history for examples of:
- Keyboard shortcuts testing
- Scroll actions
- Multi-tab/window handling
- Mobile/responsive testing
- Accessibility audits
- Performance metrics
- Visual regression testing

## Support

- GitHub Issues: Report bugs or request features
- Test failures: Check `tests/screenshots/` for visual evidence
- AI validation issues: Verify `GEMINI_API_KEY` is set correctly
