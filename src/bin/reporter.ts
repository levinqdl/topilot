import {
    FullConfig,
    FullResult,
    Reporter,
    Suite,
    TestCase,
    TestResult,
  } from "@playwright/test/reporter";
  
  class FixtureReporter implements Reporter {
    async onBegin(config: FullConfig, suite: Suite) {
      const files = new Map();
      suite.allTests().forEach((t) => {
        const [root, project, relativePath, ...titles] = t.titlePath();
        const tests =
          files.get(relativePath) ||
          files.set(relativePath, []).get(relativePath);
        tests.push({ titles, testId: t.id });
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
          const t = { title: test.titles, file, testIds: [test.testId] };
          titles.set(title, t);
          results.push(t);
        }
      }
      
  
      console.log(JSON.stringify({tests: results}));
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
  