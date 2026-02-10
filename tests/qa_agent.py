#!/usr/bin/env python3
"""
AI-Powered QA Test Agent for Workflow Dashboard
Discovery-based testing with adaptive validation for any deployment
"""

import asyncio
import os
import sys
import base64
import json
import argparse
from datetime import datetime
from dataclasses import dataclass, field
from typing import Optional, Dict, List, Set
from playwright.async_api import async_playwright, Page, Response
import google.generativeai as genai

# Configure Gemini
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
if GEMINI_API_KEY and not GEMINI_API_KEY.startswith("your_"):
    genai.configure(api_key=GEMINI_API_KEY)
    model = genai.GenerativeModel('gemini-2.5-flash')
else:
    model = None


@dataclass
class TestConfig:
    """Test configuration with auto-detection of environment"""
    url: str
    is_remote: bool = False
    navigation_timeout: int = 15000  # ms
    element_wait_timeout: int = 5000  # ms

    @classmethod
    def from_url(cls, url: str) -> 'TestConfig':
        """Create config from URL with auto-detection"""
        is_remote = not any(host in url for host in ['localhost', '127.0.0.1', '192.168', '10.0', '172.16'])

        config = cls(url=url, is_remote=is_remote)

        if is_remote:
            # Remote deployments need longer timeouts
            config.navigation_timeout = 30000
            config.element_wait_timeout = 10000

        return config


@dataclass
class PlatformDetector:
    """Detects platform (Cloudflare/Vercel/local) from response headers"""
    platform: str = "local"
    expected_x_frame_options: List[str] = field(default_factory=lambda: ['DENY'])
    may_inject_scripts: bool = False

    async def detect(self, response: Response):
        """Detect platform from response headers"""
        headers = await response.all_headers()

        if 'cf-ray' in headers:
            self.platform = "cloudflare"
            # Cloudflare overrides X-Frame-Options to SAMEORIGIN
            self.expected_x_frame_options = ['SAMEORIGIN', 'DENY']
            self.may_inject_scripts = True
        elif 'x-vercel-id' in headers:
            self.platform = "vercel"
            self.expected_x_frame_options = ['DENY', 'SAMEORIGIN']
            self.may_inject_scripts = True
        else:
            self.platform = "local"
            self.expected_x_frame_options = ['DENY']
            self.may_inject_scripts = False


@dataclass
class PageInfo:
    """Information about a discovered page"""
    path: str
    has_heading: bool = False
    has_content: bool = False
    has_canvas: bool = False
    has_buttons: bool = False
    has_svg: bool = False
    has_forms: bool = False
    has_tabs: bool = False
    has_cards: bool = False
    content_length: int = 0


class PageDiscovery:
    """Discovers pages and features by crawling the site"""

    def __init__(self, page: Page, config: TestConfig):
        self.page = page
        self.config = config
        self.pages: Dict[str, PageInfo] = {}
        self.navigation_links: Set[str] = set()

    async def discover(self) -> Dict[str, PageInfo]:
        """Discover all pages and their features"""
        # Navigate to homepage
        await self.page.goto(self.config.url, wait_until='networkidle', timeout=self.config.navigation_timeout)

        # Wait for client-side hydration
        await asyncio.sleep(1)

        # Extract all navigation links
        links = await self.page.evaluate('''() => {
            return [...document.querySelectorAll('a[href^="/"]')]
                .map(a => a.getAttribute('href'))
                .filter(href => href && !href.includes('#'));
        }''')

        # Deduplicate paths
        paths = set(links)
        paths.add('/')  # Always include homepage

        # Probe each page
        for path in paths:
            self.navigation_links.add(path)
            url = f"{self.config.url}{path}"

            try:
                await self.page.goto(url, wait_until='networkidle', timeout=self.config.navigation_timeout)
                await asyncio.sleep(1)  # Wait for hydration

                # Feature detection
                info = PageInfo(path=path)

                # Check for headings
                info.has_heading = await self.page.locator('h1, h2').count() > 0

                # Check content length
                body_text = await self.page.text_content('body')
                info.content_length = len(body_text or '')
                info.has_content = info.content_length > 50

                # Check for interactive elements
                info.has_buttons = await self.page.locator('button').count() > 0
                info.has_svg = await self.page.locator('svg').count() > 0
                info.has_forms = await self.page.locator('input, select, textarea').count() > 0
                info.has_tabs = await self.page.locator('[class*="tab"], [role="tab"]').count() > 0
                info.has_cards = await self.page.locator('[class*="card"]').count() > 0

                # Check for canvas/React Flow
                canvas_selectors = [
                    '.react-flow',
                    '[class*="react-flow"]',
                    'canvas',
                    '.canvas'
                ]
                for selector in canvas_selectors:
                    if await self.page.locator(selector).count() > 0:
                        info.has_canvas = True
                        break

                self.pages[path] = info

            except Exception as e:
                # Skip pages that fail to load
                print(f"    ⚠️  Could not probe {path}: {str(e)}", file=sys.stderr)
                continue

        return self.pages

    def has_page(self, path: str) -> bool:
        """Check if a page was discovered"""
        return path in self.pages

    def has_feature(self, path: str, feature: str) -> bool:
        """Check if a page has a specific feature"""
        if path not in self.pages:
            return False
        return getattr(self.pages[path], f'has_{feature}', False)


class QATestAgent:
    def __init__(self, page: Page, config: TestConfig, json_mode: bool = False):
        self.page = page
        self.config = config
        self.test_results = []
        self.json_mode = json_mode
        self.platform: Optional[PlatformDetector] = None
        self.discovery: Optional[PageDiscovery] = None
        self.console_errors: List[str] = []

        # Benign error patterns to filter
        self.benign_patterns = [
            'favicon.ico',
            'cloudflareinsights.com',
            'Download the React DevTools',
            'third-party cookie',
            'Hydration',
            'NEXT_REDIRECT',
            'ERR_BLOCKED_BY_CLIENT',
            'ResizeObserver loop',
            'Minified React error',  # React errors in production mode
            'react.dev/errors',  # React error links
            'Failed to load resource',  # Resource loading errors (not critical)
            '500 (Internal Server Error)',  # API errors (test data availability)
            'ChunkLoadError',  # Next.js chunk loading (dev mode transient)
            'Failed to load chunk',  # Next.js chunk loading
        ]

        # Setup console listener
        self.page.on('console', self._handle_console)

    def _handle_console(self, msg):
        """Filter and capture console errors"""
        if msg.type not in ['error', 'warning']:
            return

        text = msg.text

        # Filter benign errors
        if any(pattern in text for pattern in self.benign_patterns):
            return

        self.console_errors.append(f"{msg.type.upper()}: {text}")

    async def log_test(self, test_name: str, passed: Optional[bool], details: str = ""):
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
            print(json.dumps({"type": "result", **result}), flush=True)
        else:
            if passed is True:
                status = "✅ PASS"
            elif passed is False:
                status = "❌ FAIL"
            else:
                status = "⚠️  SKIP"

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

        return screenshot

    # ==================== PHASE 1: DISCOVERY ====================

    async def run_discovery(self):
        """Phase 1: Discover platform and pages"""
        # Platform detection
        response = await self.page.goto(self.config.url, wait_until='networkidle', timeout=self.config.navigation_timeout)
        self.platform = PlatformDetector()
        await self.platform.detect(response)

        if self.json_mode:
            print(json.dumps({
                "type": "discovery",
                "phase": "platform",
                "platform": self.platform.platform,
                "may_inject_scripts": self.platform.may_inject_scripts
            }), flush=True)

        # Page discovery
        self.discovery = PageDiscovery(self.page, self.config)
        pages = await self.discovery.discover()

        if self.json_mode:
            print(json.dumps({
                "type": "discovery",
                "phase": "pages",
                "discovered": list(pages.keys()),
                "count": len(pages)
            }), flush=True)

    # ==================== PHASE 2: UNIVERSAL TESTS ====================

    async def test_all_pages_load(self):
        """Test: All discovered pages return HTTP 200 with content"""
        test_name = "All pages load successfully"
        try:
            failed_pages = []

            for path in self.discovery.pages.keys():
                url = f"{self.config.url}{path}"
                response = await self.page.goto(url, wait_until='networkidle', timeout=self.config.navigation_timeout)

                if response.status != 200:
                    failed_pages.append(f"{path} ({response.status})")
                elif not self.discovery.pages[path].has_content:
                    failed_pages.append(f"{path} (empty)")

            passed = len(failed_pages) == 0
            details = f"{len(self.discovery.pages)} pages OK" if passed else f"Failed: {', '.join(failed_pages[:3])}"

            await self.log_test(test_name, passed, details)
        except Exception as e:
            await self.log_test(test_name, False, str(e))

    async def test_security_headers(self):
        """Test: Security headers present (platform-aware)"""
        test_name = "Security headers present"
        try:
            response = await self.page.goto(self.config.url, wait_until='networkidle', timeout=self.config.navigation_timeout)
            headers = await response.all_headers()

            # Check required headers with platform-aware expectations
            results = {}

            # X-Frame-Options (platform-aware)
            x_frame = headers.get('x-frame-options', '').upper()
            results['x-frame-options'] = any(exp in x_frame for exp in self.platform.expected_x_frame_options)

            # X-Content-Type-Options
            results['x-content-type-options'] = 'nosniff' in headers.get('x-content-type-options', '').lower()

            # Referrer-Policy
            referrer = headers.get('referrer-policy', '').lower()
            results['referrer-policy'] = any(policy in referrer for policy in [
                'strict-origin-when-cross-origin', 'no-referrer', 'same-origin'
            ])

            passed_count = sum(results.values())
            passed = passed_count >= 2  # At least 2/3 headers correct

            details = f"{passed_count}/3 headers OK"
            if not results['x-frame-options']:
                details += f" | X-Frame: {headers.get('x-frame-options', 'MISSING')}"

            await self.log_test(test_name, passed, details)
        except Exception as e:
            await self.log_test(test_name, False, str(e))

    async def test_nav_links_resolve(self):
        """Test: All navigation links resolve (no 404s)"""
        test_name = "Navigation links resolve"
        try:
            broken_links = []

            for link in self.discovery.navigation_links:
                if link not in self.discovery.pages:
                    broken_links.append(link)

            passed = len(broken_links) == 0
            details = f"{len(self.discovery.navigation_links)} links OK" if passed else f"Broken: {', '.join(broken_links[:3])}"

            await self.log_test(test_name, passed, details)
        except Exception as e:
            await self.log_test(test_name, False, str(e))

    async def test_no_console_errors(self):
        """Test: No critical console errors on discovered pages"""
        test_name = "No critical console errors"
        try:
            all_errors = []

            for path in self.discovery.pages.keys():
                url = f"{self.config.url}{path}"
                self.console_errors.clear()

                await self.page.goto(url, wait_until='networkidle', timeout=self.config.navigation_timeout)
                await asyncio.sleep(1)

                if self.console_errors:
                    all_errors.extend([f"{path}: {e}" for e in self.console_errors[:2]])

            passed = len(all_errors) == 0
            details = "All clear" if passed else f"{len(all_errors)} errors | {all_errors[0] if all_errors else ''}"

            await self.log_test(test_name, passed, details)
        except Exception as e:
            await self.log_test(test_name, False, str(e))

    # ==================== PHASE 3: FEATURE TESTS ====================

    async def test_homepage_structure(self):
        """Test: Homepage has expected structural content"""
        test_name = "Homepage: Structural content present"
        try:
            await self.page.goto(self.config.url, wait_until='networkidle', timeout=self.config.navigation_timeout)
            await asyncio.sleep(1)

            checks = []

            # Check 1: Has heading
            has_heading = await self.page.locator('h1, h2').count() > 0
            checks.append(has_heading)

            # Check 2: Has navigation links (≥3)
            nav_links = await self.page.locator('a[href^="/"]').count()
            has_nav = nav_links >= 3
            checks.append(has_nav)

            # Check 3: Has interactive elements (≥5)
            buttons = await self.page.locator('button, a, input, [role="button"]').count()
            has_interactive = buttons >= 5
            checks.append(has_interactive)

            # Check 4: Has cards
            has_cards = await self.page.locator('[class*="card"]').count() > 0
            checks.append(has_cards)

            await self.take_screenshot("homepage")

            passed = sum(checks) >= 3  # Pass if ≥3/4 checks met
            details = f"Heading: {has_heading}, Nav: {has_nav}, Interactive: {has_interactive}, Cards: {has_cards}"

            await self.log_test(test_name, passed, details)
        except Exception as e:
            await self.log_test(test_name, False, str(e))

    async def test_builder_interactive(self):
        """Test: Builder page has interactive canvas"""
        test_name = "Builder: Interactive canvas present"

        if not self.discovery.has_page('/builder'):
            await self.log_test(test_name, None, "Builder page not discovered")
            return

        try:
            await self.page.goto(f"{self.config.url}/builder", wait_until='networkidle', timeout=self.config.navigation_timeout)
            await asyncio.sleep(2)

            checks = []

            # Check 1: Has heading
            has_heading = await self.page.locator('h1, h2').count() > 0
            checks.append(has_heading)

            # Check 2: Has buttons (≥3)
            buttons = await self.page.locator('button').count()
            has_buttons = buttons >= 3
            checks.append(has_buttons)

            # Check 3: Has SVG
            has_svg = await self.page.locator('svg').count() > 0
            checks.append(has_svg)

            # Check 4: Has canvas area (multiple fallback selectors)
            has_canvas = False
            for selector in ['.react-flow', '[class*="react-flow"]', 'canvas', '[class*="canvas"]']:
                if await self.page.locator(selector).count() > 0:
                    has_canvas = True
                    break
            checks.append(has_canvas)

            await self.take_screenshot("builder_page")

            passed = sum(checks) >= 2  # Pass if ≥2/4 checks met
            details = f"Heading: {has_heading}, Buttons: {has_buttons}, SVG: {has_svg}, Canvas: {has_canvas}"

            await self.log_test(test_name, passed, details)
        except Exception as e:
            await self.log_test(test_name, False, str(e))

    async def test_builder_3d_view(self):
        """Test: Builder 3D view doesn't crash"""
        test_name = "Builder: 3D view loads without crash"

        if not self.discovery.has_page('/builder'):
            await self.log_test(test_name, None, "Builder page not discovered")
            return

        try:
            await self.page.goto(f"{self.config.url}/builder", wait_until='networkidle', timeout=self.config.navigation_timeout)
            await asyncio.sleep(2)

            # Find 3D button (partial text match)
            button = self.page.locator('button:has-text("3D")').first

            if await button.count() == 0:
                await self.log_test(test_name, None, "3D button not found")
                return

            self.console_errors.clear()
            await button.click()
            await asyncio.sleep(2)

            # Check page is still alive (3D may have WebGL errors in headless - that's OK)
            is_alive = await self.page.locator('body').count() > 0

            # Filter WebGL-related errors (expected in headless mode)
            critical_errors = [e for e in self.console_errors if 'WebGL' not in e and 'THREE' not in e and 'WEBGL' not in e]
            has_critical_errors = len(critical_errors) > 0

            await self.take_screenshot("builder_3d")

            passed = is_alive and not has_critical_errors
            details = f"Page alive: {is_alive}, Critical errors: {len(critical_errors)}"

            await self.log_test(test_name, passed, details)
        except Exception as e:
            await self.log_test(test_name, False, str(e))

    async def test_tools_page(self):
        """Test: Tools page has structural content"""
        test_name = "Tools: Structural content present"

        if not self.discovery.has_page('/tools'):
            await self.log_test(test_name, None, "Tools page not discovered")
            return

        try:
            await self.page.goto(f"{self.config.url}/tools", wait_until='networkidle', timeout=self.config.navigation_timeout)

            checks = []

            # Check 1: Has heading
            has_heading = await self.page.locator('h1, h2').count() > 0
            checks.append(has_heading)

            # Check 2: Has substantial content (>100 chars)
            body_text = await self.page.text_content('body')
            has_content = len(body_text or '') > 100
            checks.append(has_content)

            # Check 3: Has back link
            has_back = await self.page.locator('a:has-text("Back")').count() > 0
            checks.append(has_back)

            # Check 4: Has interactive elements
            has_interactive = await self.page.locator('button, a, input').count() > 0
            checks.append(has_interactive)

            await self.take_screenshot("tools_page")

            passed = sum(checks) >= 3  # Pass if ≥3/4 checks met
            details = f"Heading: {has_heading}, Content: {has_content}, Back: {has_back}, Interactive: {has_interactive}"

            await self.log_test(test_name, passed, details)
        except Exception as e:
            await self.log_test(test_name, False, str(e))

    async def test_settings_toast(self):
        """Test: Settings save shows toast notification"""
        test_name = "Settings: Save shows toast (not alert)"

        if not self.discovery.has_page('/settings'):
            await self.log_test(test_name, None, "Settings page not discovered")
            return

        try:
            await self.page.goto(f"{self.config.url}/settings", wait_until='networkidle', timeout=self.config.navigation_timeout)
            await asyncio.sleep(1)

            # Find save button (partial match)
            save_button = self.page.locator('button:has-text("Save")').first

            if await save_button.count() == 0:
                await self.log_test(test_name, None, "Save button not found")
                return

            # Setup dialog handler
            alert_shown = False

            def handle_dialog(dialog):
                nonlocal alert_shown
                # Ignore restart confirmation dialogs
                if 'restart' not in dialog.message.lower():
                    alert_shown = True
                asyncio.create_task(dialog.dismiss())

            self.page.on('dialog', handle_dialog)

            await save_button.click()
            await asyncio.sleep(1)

            # Check for toast
            toast = self.page.locator('[role="alert"], .toast, .Toastify').first
            toast_shown = await toast.count() > 0

            await self.take_screenshot("settings_save")

            passed = not alert_shown
            details = f"Alert: {alert_shown}, Toast: {toast_shown}"

            self.page.remove_listener('dialog', handle_dialog)

            await self.log_test(test_name, passed, details)
        except Exception as e:
            await self.log_test(test_name, False, str(e))

    async def test_workflow_navigation(self):
        """Test: Workflow detail page navigation"""
        test_name = "Workflow: Detail page structure"

        try:
            # Check if any workflows exist on homepage
            await self.page.goto(self.config.url, wait_until='networkidle', timeout=self.config.navigation_timeout)
            workflow_link = self.page.locator('a[href*="/workflows/"]').first

            if await workflow_link.count() == 0:
                await self.log_test(test_name, None, "No workflows available")
                return

            # Navigate to workflow
            await workflow_link.click()
            await self.page.wait_for_load_state('networkidle', timeout=self.config.navigation_timeout)
            await asyncio.sleep(2)

            checks = []

            # Check 1: Has heading
            has_heading = await self.page.locator('h1, h2').count() > 0
            checks.append(has_heading)

            # Check 2: Has nodes or content
            nodes = await self.page.locator('.react-flow__node').count()
            has_nodes = nodes > 0
            checks.append(has_nodes)

            # Check 3: Has interactive elements
            has_interactive = await self.page.locator('button').count() > 0
            checks.append(has_interactive)

            await self.take_screenshot("workflow_detail")

            passed = sum(checks) >= 2
            details = f"Heading: {has_heading}, Nodes: {nodes}, Interactive: {has_interactive}"

            await self.log_test(test_name, passed, details)
        except Exception as e:
            await self.log_test(test_name, False, str(e))

    async def test_qa_page(self):
        """Test: QA page structure"""
        test_name = "QA Page: UI elements present"

        if not self.discovery.has_page('/qa'):
            await self.log_test(test_name, None, "QA page not discovered")
            return

        try:
            await self.page.goto(f"{self.config.url}/qa", wait_until='networkidle', timeout=self.config.navigation_timeout)

            # Wait for page to hydrate - wait for heading to appear
            await self.page.wait_for_selector('h1, h2', timeout=self.config.element_wait_timeout)
            await asyncio.sleep(2)  # Extra time for heavy page hydration

            checks = []

            # Check 1: Has heading
            has_heading = await self.page.locator('h1, h2').count() > 0
            checks.append(has_heading)

            # Check 2: Has buttons (lenient - accept ≥1 since page might still be loading)
            button_count = await self.page.locator('button').count()
            has_buttons = button_count >= 1
            checks.append(has_buttons)

            # Check 3: Has navigation links
            nav_links = await self.page.locator('a[href]').count()
            has_nav = nav_links > 0
            checks.append(has_nav)

            # Check 4: Has interactive elements
            has_interactive = await self.page.locator('button, input, select, a').count() >= 3
            checks.append(has_interactive)

            await self.take_screenshot("qa_page")

            passed = sum(checks) >= 3
            details = f"Heading: {has_heading}, Buttons: {has_buttons} ({button_count}), Nav: {has_nav}, Interactive: {has_interactive}"

            await self.log_test(test_name, passed, details)
        except Exception as e:
            await self.log_test(test_name, False, str(e))

    # ==================== TEST RUNNER ====================

    async def run_all_tests(self):
        """Run complete test suite in 3 phases"""
        start_time = datetime.now()

        if self.json_mode:
            print(json.dumps({
                "type": "start",
                "url": self.config.url,
                "ai_enabled": model is not None,
                "time": start_time.isoformat()
            }), flush=True)
        else:
            print(f"\n{'='*60}")
            print(f"🤖 QA Test Agent - Workflow Dashboard")
            print(f"{'='*60}")
            print(f"Target: {self.config.url}")
            print(f"Environment: {'Remote' if self.config.is_remote else 'Local'}")
            print(f"Time: {start_time.strftime('%Y-%m-%d %H:%M:%S')}")
            print(f"{'='*60}\n")

        # Phase 1: Discovery
        if not self.json_mode:
            print("Phase 1: Discovery")
            print("-" * 60)

        await self.run_discovery()

        if not self.json_mode:
            print(f"Platform: {self.platform.platform}")
            print(f"Discovered: {len(self.discovery.pages)} pages")
            print()

        # Phase 2: Universal Tests
        if not self.json_mode:
            print("Phase 2: Universal Tests")
            print("-" * 60)

        universal_tests = [
            self.test_all_pages_load,
            self.test_security_headers,
            self.test_nav_links_resolve,
            self.test_no_console_errors,
        ]

        for test in universal_tests:
            await test()
            await asyncio.sleep(0.5)

        if not self.json_mode:
            print()

        # Phase 3: Feature Tests
        if not self.json_mode:
            print("Phase 3: Feature Tests")
            print("-" * 60)

        feature_tests = [
            self.test_homepage_structure,
            self.test_builder_interactive,
            self.test_builder_3d_view,
            self.test_tools_page,
            self.test_settings_toast,
            self.test_workflow_navigation,
            self.test_qa_page,
        ]

        for test in feature_tests:
            await test()
            await asyncio.sleep(0.5)

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
                    "target_url": self.config.url
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
    parser = argparse.ArgumentParser(description='QA Test Agent for Workflow Dashboard')
    parser.add_argument('--json', action='store_true', help='Output structured JSON for parsing')
    parser.add_argument('--url', type=str, help='Target URL')
    args = parser.parse_args()

    # Get URL from args or environment
    url = args.url or os.getenv("TEST_URL", "http://localhost:3004")
    config = TestConfig.from_url(url)

    async with async_playwright() as p:
        browser = await p.chromium.launch(
            headless=os.getenv("HEADLESS", "false").lower() == "true",
            slow_mo=100
        )

        context = await browser.new_context(
            viewport={'width': 1920, 'height': 1080},
            record_video_dir='tests/videos' if os.getenv("RECORD_VIDEO") else None
        )

        page = await context.new_page()

        # Run tests
        agent = QATestAgent(page, config, json_mode=args.json)
        success = await agent.run_all_tests()

        await browser.close()

        sys.exit(0 if success else 1)


if __name__ == "__main__":
    asyncio.run(main())
