import fixtures from "./fixtures";
import { test } from "@playwright/test";
import path from "path";
import skippedTeardowns from "./skippedTeardowns";
import { getFixtures } from "./getFixtures";
import * as caseApi from "./api/case";
import { getCurrentBranch } from "./api/getCurrentBranch";
import { getFixtureFn } from "./getFixtureFn";

export interface Fixtures {}

function markFixturesTeardownSkipped(fn: any) {
  const fixtureNames = getFixtures(fn);
  for (const fixtureName of fixtureNames) {
    skippedTeardowns.add(fixtureName);
  }
}

interface Test {
  file: string;
  title: string[];
  testIds: string[];
  selected?: boolean;
}

let topilot = test.extend<{ faillingWithFixture: void }, Fixtures>({
  faillingWithFixture: [
    async ({}, use, testInfo) => {
      await use();
      if (testInfo.status !== testInfo.expectedStatus) {
        for (const hook of (testInfo as any)._test.parent._hooks) {
          if (hook.type === "beforeEach") {
            markFixturesTeardownSkipped(hook.fn);
          }
        }
        markFixturesTeardownSkipped(testInfo.fn);
      }
    },
    { auto: true },
  ],
});

for (const fixtureFile of fixtures) {
  const { setup, teardown, name, schema } = require(path.join(
    process.cwd(),
    fixtureFile
  ));
  const fn = getFixtureFn({ name, setup, teardown, schema });
  fn.toString = () => setup.toString();
  topilot = topilot.extend({
    [name]: [fn, { scope: "worker" }],
  });
}

if (process.env.CI) {
  topilot = topilot.extend<{ shouldRun: void }, { keyCases: Test[] }>({
    keyCases: [
      async ({}, use) => {
        const branch = await getCurrentBranch();
        const cases = await caseApi.pull(branch);
        if (!cases) {
          console.log("no key cases found, all tests will run");
        }
        use(cases);
      },
      { scope: "worker" },
    ],
    shouldRun: [
      async ({ keyCases }, use, testInfo) => {
        if (keyCases) {
          if (!keyCases.some((test) => test.testIds.includes(testInfo.testId)))
            testInfo.skip(true, "skipped because not selected in key cases");
          else console.log("test selected in key cases");
        }
        use();
      },
      { auto: true },
    ],
  });
}

export default topilot;
export { default as wrap } from "./wrap";
