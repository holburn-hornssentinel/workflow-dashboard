export interface TestResult {
  id: string;
  name: string;
  category: 'api' | 'ui' | 'integration' | 'e2e';
  status: 'passed' | 'failed' | 'skipped' | 'running';
  duration: number;
  error?: string;
  details?: string;
  timestamp: string;
}

export interface TestSuite {
  id: string;
  name: string;
  category: 'api' | 'ui' | 'integration' | 'e2e';
  tests: Test[];
}

export interface Test {
  id: string;
  name: string;
  description: string;
  run: () => Promise<TestResult>;
}

export interface TestReport {
  timestamp: string;
  totalTests: number;
  passed: number;
  failed: number;
  skipped: number;
  duration: number;
  results: TestResult[];
  coverage: {
    api: number;
    ui: number;
    integration: number;
  };
}
