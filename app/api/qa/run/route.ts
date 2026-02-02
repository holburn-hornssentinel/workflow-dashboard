import { NextResponse } from 'next/server';
import { TestRunner } from '@/lib/qa/runner';
import { apiTestSuite } from '@/lib/qa/suites/api-tests';
import { integrationTestSuite } from '@/lib/qa/suites/integration-tests';

export async function POST() {
  try {
    const runner = new TestRunner();

    // Add all test suites
    runner.addSuite(apiTestSuite);
    runner.addSuite(integrationTestSuite);

    // Run all tests
    const report = await runner.runAll();

    return NextResponse.json(report);
  } catch (error) {
    console.error('[QA] Test execution failed:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Test execution failed',
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  // Return available test suites
  return NextResponse.json({
    suites: [
      {
        id: apiTestSuite.id,
        name: apiTestSuite.name,
        category: apiTestSuite.category,
        testCount: apiTestSuite.tests.length,
      },
      {
        id: integrationTestSuite.id,
        name: integrationTestSuite.name,
        category: integrationTestSuite.category,
        testCount: integrationTestSuite.tests.length,
      },
    ],
  });
}
