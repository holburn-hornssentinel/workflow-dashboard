import { TestSuite, TestResult, TestReport } from './types';

export class TestRunner {
  private suites: TestSuite[] = [];
  private results: TestResult[] = [];

  addSuite(suite: TestSuite) {
    this.suites.push(suite);
  }

  async runAll(): Promise<TestReport> {
    const startTime = Date.now();
    this.results = [];

    for (const suite of this.suites) {
      for (const test of suite.tests) {
        const result = await this.runTest(test);
        this.results.push(result);
      }
    }

    const duration = Date.now() - startTime;
    const passed = this.results.filter((r) => r.status === 'passed').length;
    const failed = this.results.filter((r) => r.status === 'failed').length;
    const skipped = this.results.filter((r) => r.status === 'skipped').length;

    return {
      timestamp: new Date().toISOString(),
      totalTests: this.results.length,
      passed,
      failed,
      skipped,
      duration,
      results: this.results,
      coverage: this.calculateCoverage(),
    };
  }

  async runTest(test: any): Promise<TestResult> {
    const startTime = Date.now();
    try {
      const result = await test.run();
      result.duration = Date.now() - startTime;
      return result;
    } catch (error) {
      return {
        id: test.id,
        name: test.name,
        category: 'api',
        status: 'failed',
        duration: Date.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      };
    }
  }

  private calculateCoverage() {
    const apiTests = this.results.filter((r) => r.category === 'api');
    const uiTests = this.results.filter((r) => r.category === 'ui');
    const integrationTests = this.results.filter((r) => r.category === 'integration');

    return {
      api: apiTests.length > 0 ? (apiTests.filter((r) => r.status === 'passed').length / apiTests.length) * 100 : 0,
      ui: uiTests.length > 0 ? (uiTests.filter((r) => r.status === 'passed').length / uiTests.length) * 100 : 0,
      integration: integrationTests.length > 0 ? (integrationTests.filter((r) => r.status === 'passed').length / integrationTests.length) * 100 : 0,
    };
  }
}
