import {
  FullConfig,
  FullResult,
  Reporter,
  Suite,
  TestCase,
  TestResult,
} from "@playwright/test/reporter";
import { getFixtures } from "../getFixtures";
import parseSchema from "./parseSchema";

type TestCaseDetails = TestCase & {
  fn: any;
  parent: SuiteDetails;
}

type SuiteDetails = Suite & {
  _hooks: any[];
  parent: SuiteDetails;
}

const getFixturesFromSuite = (suite: SuiteDetails): string[] => {
  const fixtures = suite._hooks
    .filter((h) => h.type.startsWith("before"))
    .map((h) => h.fn)
    .flatMap((fn) => getFixtures(fn));
  if (suite.parent) {
    return [...fixtures, ...getFixturesFromSuite(suite.parent)];
  }
  return fixtures;
}

const getFixturesFromTest = (test: TestCaseDetails ) => {
  const fixtures = getFixtures(test.fn);
  if (test.parent) {
    return [...new Set([...fixtures, ...getFixturesFromSuite(test.parent)])];
  }
  return fixtures;
}


class FixtureReporter implements Reporter {
  async onBegin(config: FullConfig, suite: Suite) {
    const files = new Map();
    const fixturesHash = {}
    suite.allTests().forEach((t: any) => {
      const [root, project, relativePath, ...titles] = t.titlePath();
      const tests =
        files.get(relativePath) ||
        files.set(relativePath, []).get(relativePath);
        const fixtures = getFixturesFromTest(t)
      tests.push({ titles, testId: t.id, fixtures  });
    });
    const results = [];
    for (const [file, tests] of files.entries()) {
      // dedupe tests by titles
      const titles = new Map();
      for (const test of tests) {
        const title = test.titles.join(" ");
        if (titles.has(title)) {
          titles.get(title).testIds.push(test.testId);
          continue;
        }
        const t = { title: test.titles, file, testIds: [test.testId], fixtures: test.fixtures };
        titles.set(title, t);
        results.push(t);
      }
    }

    console.log(JSON.stringify({ tests: results }));
  }

  onTestBegin(test: TestCase, result: TestResult) {
    console.log(`Starting test ${test.title}`);
  }

  onTestEnd(test: TestCase, result: TestResult) {
    console.log(`Finished test ${test.title}: ${result.status}`);
  }

  onEnd(result: FullResult) {
    // console.log(`Finished the run: ${result.status}`);
  }
}

export default FixtureReporter;
