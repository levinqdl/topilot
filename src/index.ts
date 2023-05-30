import fixtures from "./fixtures";
import { test } from "@playwright/test";
import path from "path";
import { push, pull } from "./api/fixture";
import skippedTeardowns from "./skippedTeardowns";
import { getFixtures } from "./getFixtures";

let topilotTest = test.extend<{ faillingWithFixture: void }>({
  faillingWithFixture: [
    async ({}, use, testInfo) => {
      await use();
      function markFixturesTeardownSkipped(fn: any) {
        const fixtureNames = getFixtures(fn);
        for (const fixtureName of fixtureNames) {
          skippedTeardowns.add(fixtureName);
        }
      }
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
})

for (const fixture of fixtures) {
  const { setup, teardown, name } = require(path.join(process.cwd(), fixture));
  const fn = async (fixtures: any, use: any) => {
    let state = await pull();
    let value = state?.[name];
    let setupped = false;
    if (!value) {
      state = await setup(fixtures)
      value = state?.[name];
      setupped = true;
      console.log(`topilot: setup ${name} ${JSON.stringify(value)}`);
    } else {
      console.log(`topilot: pull ${name} ${JSON.stringify(value)}`);
    }
    await use(value);
    if (setupped) {
      const nextValue = await teardown({ fixtures, ...state, [name]: value });
      await push(nextValue);
      console.log(`topilot: push ${JSON.stringify( nextValue )}`);
    }
  };
  fn.toString = () => setup.toString();
  topilotTest = topilotTest.extend({
    [name]: [fn, { scope: "worker" }],
  });
}

export default topilotTest;
export {default as wrap} from './wrap'
