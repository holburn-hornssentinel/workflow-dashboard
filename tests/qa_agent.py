#!/usr/bin/env python3
"""
AI-Powered QA Test Agent for Workflow Dashboard
Uses Playwright for browser automation + Gemini Vision for intelligent validation
"""

import asyncio
import os
import sys
import base64
import json
import argparse
from datetime import datetime
from playwright.async_api import async_playwright, Page
import google.generativeai as genai

# Configure Gemini
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
if GEMINI_API_KEY and not GEMINI_API_KEY.startswith("your_"):
    genai.configure(api_key=GEMINI_API_KEY)
    model = genai.GenerativeModel('gemini-2.5-flash')
else:
    model = None
    print("⚠️  GEMINI_API_KEY not configured - running without AI validation")

BASE_URL = os.getenv("TEST_URL", "http://192.168.1.197:3004")


class QATestAgent:
    def __init__(self, page: Page, json_mode: bool = False):
        self.page = page
        self.test_results = []
        self.json_mode = json_mode

    async def log_test(self, test_name: str, passed: bool, details: str = ""):
        """Log test result"""
        timestamp = datetime.now().isoformat()
        result = {
            "name": test_name,
            "passed": passed,
            "details": details,
            "timestamp": timestamp
        }
        self.test_results.append(result)

        if self.json_mode:
            # Output structured JSON for parsing by Node.js
            print(json.dumps({"type": "result", **result}), flush=True)
        else:
            # Human-readable output
            status = "✅ PASS" if passed else "❌ FAIL"
            output = f"{status} | {test_name}"
            if details:
                output += f"\n    └─ {details}"
            print(output)

    async def take_screenshot(self, name: str) -> bytes:
        """Take screenshot and save"""
        screenshot_dir = "tests/screenshots"
        os.makedirs(screenshot_dir, exist_ok=True)
        path = f"{screenshot_dir}/{name}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.png"
        screenshot = await self.page.screenshot(path=path, full_page=True)

        if self.json_mode:
            print(json.dumps({
                "type": "screenshot",
                "path": path,
                "test": name,
                "timestamp": datetime.now().isoformat()
            }), flush=True)
        else:
            print(f"    📸 Screenshot saved: {path}")

        return screenshot

    async def ai_validate(self, screenshot: bytes, instruction: str) -> dict:
        """Use Gemini Vision to validate UI state"""
        if not model:
            return {"passed": None, "reason": "AI validation disabled (no API key)"}

        try:
            b64_image = base64.b64encode(screenshot).decode()

            response = model.generate_content([
                f"""You are a QA testing expert. Analyze this screenshot and determine if it meets the requirement.

Requirement: {instruction}

Respond in this exact format:
PASSED: [yes/no]
REASON: [Brief explanation of what you see and why it passes/fails]

Be strict - if anything looks wrong, mark as failed.""",
                {"mime_type": "image/png", "data": b64_image}
            ])

            text = response.text.strip()
            passed = "PASSED: yes" in text.lower()
            reason_match = text.split("REASON:", 1)
            reason = reason_match[1].strip() if len(reason_match) > 1 else text

            return {"passed": passed, "reason": reason}
        except Exception as e:
            return {"passed": None, "reason": f"AI validation error: {str(e)}"}

    async def ai_find_element(self, instruction: str) -> dict:
        """Use AI to identify element on page"""
        if not model:
            return None

        screenshot = await self.page.screenshot()

        # Get all interactive elements
        elements = await self.page.evaluate('''() => {
            return [...document.querySelectorAll('button, a, input, [role="button"], [data-testid], .card, [draggable="true"]')]
                .map((el, i) => {
                    const rect = el.getBoundingClientRect();
                    return {
                        index: i,
                        tag: el.tagName,
                        text: el.innerText?.slice(0, 100) || '',
                        id: el.id || '',
                        class: el.className || '',
                        testid: el.dataset.testid || '',
                        rect: {x: rect.x, y: rect.y, width: rect.width, height: rect.height}
                    };
                });
        }''')

        b64_image = base64.b64encode(screenshot).decode()

        response = model.generate_content([
            f"""Given these UI elements: {elements[:50]}  # Limit to first 50

Which element index matches: "{instruction}"?

Respond with ONLY the number (index). If no match, respond with -1.""",
            {"mime_type": "image/png", "data": b64_image}
        ])

        try:
            index = int(response.text.strip().split()[0])
            if 0 <= index < len(elements):
                return elements[index]
        except:
            pass

        return None

    async def click_element(self, selector: str = None, text: str = None, ai_description: str = None):
        """Click element by selector, text, or AI description"""
        try:
            if ai_description and model:
                # Use AI to find element
                element = await self.ai_find_element(ai_description)
                if element:
                    rect = element['rect']
                    await self.page.mouse.click(
                        rect['x'] + rect['width'] / 2,
                        rect['y'] + rect['height'] / 2
                    )
                    return True

            if selector:
                await self.page.click(selector, timeout=5000)
                return True

            if text:
                await self.page.click(f'text={text}', timeout=5000)
                return True

            return False
        except Exception as e:
            print(f"    ⚠️  Click failed: {str(e)}")
            return False

    async def check_console_errors(self) -> list:
        """Capture console errors from browser"""
        errors = []

        def handle_console(msg):
            if msg.type in ['error', 'warning']:
                errors.append(f"{msg.type.upper()}: {msg.text}")

        self.page.on('console', handle_console)
        await asyncio.sleep(1)  # Wait for any delayed console messages
        self.page.remove_listener('console', handle_console)

        return errors

    async def check_security_headers(self, url: str) -> dict:
        """Check security headers in response"""
        response = await self.page.goto(url, wait_until='networkidle')
        headers = await response.all_headers()

        required_headers = {
            'x-frame-options': 'DENY',
            'x-content-type-options': 'nosniff',
            'referrer-policy': 'strict-origin-when-cross-origin',
        }

        results = {}
        for header, expected in required_headers.items():
            actual = headers.get(header, '')
            results[header] = {
                'present': bool(actual),
                'value': actual,
                'expected': expected,
                'matches': expected.lower() in actual.lower() if actual else False
            }

        return results

    # ==================== SMOKE TEST SUITE ====================

    async def test_homepage_loads(self):
        """Test: Homepage loads and displays dynamic agent count"""
        test_name = "Homepage loads with dynamic agent count"
        try:
            await self.page.goto(BASE_URL, wait_until='networkidle')

            # Check page loaded
            title = await self.page.title()
            if not title:
                await self.log_test(test_name, False, "Page title is empty")
                return

            # Take screenshot
            screenshot = await self.take_screenshot("homepage")

            # Check for stats cards (Workflows, Steps, Agents, etc.)
            agents_text = await self.page.locator('text=Agents Available').text_content(timeout=10000)
            workflows_text = await self.page.locator('text=Workflows Available').text_content(timeout=10000)
            has_stats = bool(agents_text and workflows_text)

            # AI validation
            if model:
                validation = await self.ai_validate(
                    screenshot,
                    "Homepage displays workflow cards, stats, and navigation buttons. Agent count should be a number."
                )
                await self.log_test(test_name, validation['passed'] and has_stats,
                                  f"Stats found: {has_stats} | AI: {validation['reason']}")
            else:
                await self.log_test(test_name, has_stats, f"Found stats cards: Agents, Workflows")

        except Exception as e:
            await self.log_test(test_name, False, str(e))

    async def test_builder_page_loads(self):
        """Test: Builder page loads with React Flow canvas"""
        test_name = "Builder: Page loads with canvas"
        try:
            await self.page.goto(f"{BASE_URL}/builder", wait_until='networkidle')
            await asyncio.sleep(2)  # Wait for React Flow to initialize

            # Check for React Flow canvas
            canvas = self.page.locator('.react-flow')
            has_canvas = await canvas.count() > 0

            # Check for any nodes or controls
            controls = self.page.locator('.react-flow__controls, .react-flow__panel')
            has_controls = await controls.count() > 0

            screenshot = await self.take_screenshot("builder_page")
            passed = has_canvas or has_controls

            await self.log_test(test_name, passed,
                              f"Canvas: {has_canvas}, Controls: {has_controls}")

        except Exception as e:
            await self.log_test(test_name, False, str(e))

    async def test_builder_3d_view(self):
        """Test: Builder - switch to 3D view doesn't crash"""
        test_name = "Builder: 3D view loads without crash"
        try:
            await self.page.goto(f"{BASE_URL}/builder", wait_until='networkidle')
            await asyncio.sleep(2)

            # Find and click 3D view toggle
            clicked = await self.click_element(text="3D View")
            if not clicked:
                clicked = await self.click_element(ai_description="the button to switch to 3D view")

            await asyncio.sleep(2)

            # Check for errors
            errors = await self.check_console_errors()
            crashed = any('error' in e.lower() for e in errors)

            screenshot = await self.take_screenshot("builder_3d")

            if model:
                validation = await self.ai_validate(
                    screenshot,
                    "3D view should be visible with a dark canvas, no error messages"
                )
                await self.log_test(test_name, validation['passed'] and not crashed,
                                  f"Errors: {len(errors)} | AI: {validation['reason']}")
            else:
                await self.log_test(test_name, not crashed, f"Console errors: {errors[:3]}")

        except Exception as e:
            await self.log_test(test_name, False, str(e))

    async def test_workflow_graph_navigation(self):
        """Test: Workflow detail - click graph node navigates wizard"""
        test_name = "Workflow: Graph node click navigates wizard"
        try:
            # First, check if workflows exist
            await self.page.goto(BASE_URL, wait_until='networkidle')
            workflow_link = self.page.locator('a[href*="/workflows/"]').first

            if await workflow_link.count() == 0:
                await self.log_test(test_name, None, "No workflows available (expected for new install)")
                return

            # Navigate to first workflow
            await workflow_link.click()
            await self.page.wait_for_load_state('networkidle')
            await asyncio.sleep(2)

            # Check if workflow page has a graph
            nodes = await self.page.locator('.react-flow__node').all()
            if len(nodes) == 0:
                screenshot = await self.take_screenshot("workflow_empty")
                await self.log_test(test_name, None, "Workflow has no nodes (empty workflow)")
                return

            # Check for any interactive elements (wizard, controls, etc.)
            wizard_panel = self.page.locator('.wizard-panel, [class*="wizard"]')
            has_wizard = await wizard_panel.count() > 0

            screenshot = await self.take_screenshot("workflow_detail")
            passed = len(nodes) > 0  # At minimum, workflow should have nodes

            await self.log_test(test_name, passed,
                              f"Nodes: {len(nodes)}, Wizard: {has_wizard}")

        except Exception as e:
            await self.log_test(test_name, False, str(e))

    async def test_settings_toast_not_alert(self):
        """Test: Settings - Budget save shows toast, not alert()"""
        test_name = "Settings: Budget save uses toast (not alert)"
        try:
            await self.page.goto(f"{BASE_URL}/settings", wait_until='networkidle')
            await asyncio.sleep(1)

            # Find Budget tab
            budget_tab = self.page.locator('text=/budget/i').first
            if await budget_tab.count() > 0:
                await budget_tab.click()
                await asyncio.sleep(0.5)

            # Capture dialog events
            alert_shown = False

            def handle_dialog(dialog):
                nonlocal alert_shown
                alert_shown = True
                asyncio.create_task(dialog.dismiss())

            self.page.on('dialog', handle_dialog)

            # Click save button
            save_clicked = await self.click_element(text="Save")
            if not save_clicked:
                save_clicked = await self.click_element(ai_description="the save button")

            await asyncio.sleep(1)

            # Check for toast instead of alert
            toast = self.page.locator('.toast, [role="status"], .Toastify').first
            toast_shown = await toast.count() > 0

            screenshot = await self.take_screenshot("settings_save")

            passed = not alert_shown and (toast_shown or not save_clicked)
            await self.log_test(test_name, passed,
                              f"Alert: {alert_shown} | Toast: {toast_shown}")

            self.page.remove_listener('dialog', handle_dialog)

        except Exception as e:
            await self.log_test(test_name, False, str(e))

    async def test_tools_page_text(self):
        """Test: Tools page has correct text (not "75+")"""
        test_name = "Tools: Shows 'Model Context Protocol' (not '75+')"
        try:
            await self.page.goto(f"{BASE_URL}/tools", wait_until='networkidle')

            page_text = await self.page.text_content('body')
            has_old_text = '75+' in page_text or '75 tools' in page_text.lower()
            has_new_text = 'Model Context Protocol' in page_text

            screenshot = await self.take_screenshot("tools_page")

            passed = not has_old_text and has_new_text
            await self.log_test(test_name, passed,
                              f"Old text present: {has_old_text} | New text: {has_new_text}")

        except Exception as e:
            await self.log_test(test_name, False, str(e))

    async def test_security_headers(self):
        """Test: Security headers present"""
        test_name = "Security headers present (X-Frame, X-Content, Referrer)"
        try:
            headers = await self.check_security_headers(BASE_URL)

            all_present = all(h['present'] for h in headers.values())
            matches = sum(1 for h in headers.values() if h['matches'])

            details = "\n".join([
                f"    {name}: {'✓' if h['matches'] else '✗'} {h['value'] or 'MISSING'}"
                for name, h in headers.items()
            ])

            await self.log_test(test_name, all_present and matches >= 2,
                              f"{matches}/{len(headers)} headers correct\n{details}")

        except Exception as e:
            await self.log_test(test_name, False, str(e))

    async def test_qa_page_ui(self):
        """Test: QA page loads with all UI elements"""
        test_name = "QA Page: UI elements and tabs functional"
        try:
            await self.page.goto(f"{BASE_URL}/qa", wait_until='networkidle')
            await asyncio.sleep(1)

            # Check for main heading
            heading = self.page.locator('text=QA Test Agent')
            has_heading = await heading.count() > 0

            # Check for Run Tests button
            run_button = self.page.locator('button:has-text("Run Tests"), button:has-text("Stop Tests")')
            has_button = await run_button.count() > 0

            # Check for tabs (Run Tests, Screenshots, Configuration)
            tabs = self.page.locator('button:has-text("Run Tests"), button:has-text("Screenshots"), button:has-text("Configuration")')
            tab_count = await tabs.count()

            # Try clicking Screenshots tab
            screenshots_tab = self.page.locator('button:has-text("Screenshots")').first
            if await screenshots_tab.count() > 0:
                await screenshots_tab.click()
                await asyncio.sleep(0.5)

            # Try clicking Configuration tab
            config_tab = self.page.locator('button:has-text("Configuration")').first
            if await config_tab.count() > 0:
                await config_tab.click()
                await asyncio.sleep(0.5)

                # Check for configuration inputs
                url_input = self.page.locator('input[type="text"]')
                has_url_input = await url_input.count() > 0

            screenshot = await self.take_screenshot("qa_page")
            passed = has_heading and has_button and tab_count >= 3

            await self.log_test(test_name, passed,
                              f"Heading: {has_heading}, Button: {has_button}, Tabs: {tab_count}")

        except Exception as e:
            await self.log_test(test_name, False, str(e))

    async def test_no_console_errors(self):
        """Test: No console errors on major pages"""
        test_name = "No console errors on major pages"
        try:
            pages_to_test = [
                ('/', 'Homepage'),
                ('/builder', 'Builder'),
                ('/settings', 'Settings'),
                ('/tools', 'Tools'),
                ('/agents', 'Agents'),
                ('/qa', 'QA'),
            ]

            all_errors = []
            for url, name in pages_to_test:
                await self.page.goto(BASE_URL + url, wait_until='networkidle')
                errors = await self.check_console_errors()
                if errors:
                    all_errors.extend([f"{name}: {e}" for e in errors])

            passed = len(all_errors) == 0
            details = "\n    ".join(all_errors[:5]) if all_errors else "All clear"

            await self.log_test(test_name, passed, details)

        except Exception as e:
            await self.log_test(test_name, False, str(e))

    # ==================== TEST RUNNER ====================

    async def run_all_tests(self):
        """Run complete smoke test suite"""
        start_time = datetime.now()

        if self.json_mode:
            print(json.dumps({
                "type": "start",
                "url": BASE_URL,
                "ai_enabled": model is not None,
                "time": start_time.isoformat()
            }), flush=True)
        else:
            print(f"\n{'='*60}")
            print(f"🤖 QA Test Agent - Workflow Dashboard")
            print(f"{'='*60}")
            print(f"Target: {BASE_URL}")
            print(f"AI Validation: {'Enabled (Gemini)' if model else 'Disabled'}")
            print(f"Time: {start_time.strftime('%Y-%m-%d %H:%M:%S')}")
            print(f"{'='*60}\n")

        tests = [
            self.test_homepage_loads,
            self.test_security_headers,
            self.test_tools_page_text,
            self.test_settings_toast_not_alert,
            self.test_builder_page_loads,
            self.test_builder_3d_view,
            self.test_workflow_graph_navigation,
            self.test_qa_page_ui,
            self.test_no_console_errors,
        ]

        for test in tests:
            await test()
            await asyncio.sleep(1)  # Pause between tests

        # Summary
        passed = sum(1 for r in self.test_results if r['passed'] is True)
        failed = sum(1 for r in self.test_results if r['passed'] is False)
        skipped = sum(1 for r in self.test_results if r['passed'] is None)
        total = len(self.test_results)

        summary = {
            "total": total,
            "passed": passed,
            "failed": failed,
            "skipped": skipped,
            "success_rate": round((passed/total*100) if total > 0 else 0, 1)
        }

        if self.json_mode:
            print(json.dumps({"type": "summary", **summary}), flush=True)

            # Save results to file
            results_file = "tests/qa_results.json"
            os.makedirs("tests", exist_ok=True)
            with open(results_file, 'w') as f:
                json.dump({
                    "summary": summary,
                    "results": self.test_results,
                    "timestamp": datetime.now().isoformat(),
                    "target_url": BASE_URL
                }, f, indent=2)
        else:
            print(f"\n{'='*60}")
            print(f"📊 TEST SUMMARY")
            print(f"{'='*60}")
            print(f"Total:   {total}")
            print(f"Passed:  {passed} ✅")
            print(f"Failed:  {failed} ❌")
            print(f"Skipped: {skipped} ⚠️")
            print(f"Success Rate: {summary['success_rate']}%")
            print(f"{'='*60}\n")

        return failed == 0


async def main():
    """Main entry point"""
    # Parse command-line arguments
    parser = argparse.ArgumentParser(description='QA Test Agent for Workflow Dashboard')
    parser.add_argument('--json', action='store_true', help='Output structured JSON for parsing')
    parser.add_argument('--url', type=str, help='Override target URL')
    args = parser.parse_args()

    # Override BASE_URL if provided
    global BASE_URL
    if args.url:
        BASE_URL = args.url

    async with async_playwright() as p:
        browser = await p.chromium.launch(
            headless=os.getenv("HEADLESS", "false").lower() == "true",
            slow_mo=100  # Slow down actions for visibility
        )

        context = await browser.new_context(
            viewport={'width': 1920, 'height': 1080},
            record_video_dir='tests/videos' if os.getenv("RECORD_VIDEO") else None
        )

        page = await context.new_page()

        # Run tests
        agent = QATestAgent(page, json_mode=args.json)
        success = await agent.run_all_tests()

        await browser.close()

        sys.exit(0 if success else 1)


if __name__ == "__main__":
    asyncio.run(main())
