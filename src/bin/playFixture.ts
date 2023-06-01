import inquirer from "inquirer";
import child_process from "child_process";
import { writeFile } from "../writeFile";
import fixtures from "../fixtures";

async function playTest(testFileName: any, title: string) {
  const child = await child_process.spawn("npx", [
    "playwright",
    "test",
    "-c",
    "node_modules/.topilot/playwright.config.js",
    "--project=chromium",
    "--reporter=line",
    `node_modules/.topilot/${testFileName}`,
    "-g",
    title,
  ]);
  child.stdout.on("data", (data) => {
    console.log(data.toString());
  });
  child.stderr.on("data", (data) => {
    console.error(data.toString());
  });
  child.on("close", (code) => {
    console.log(`child process exited with code ${code}`);
  });
}

async function createTestOfFixture(answers: any) {
  const fixtureName = answers.fixture
    .split("/")
    .slice(-1)[0]
    .replace(".fixture.ts", "");
  const testFileName = answers.fixture.replace(".fixture.ts", ".test.js");
  const content = `
const { setup, teardown } = require("${process.cwd()}/${answers.fixture.replace(
  ".ts",
  ""
)}");
const test = require('topilot').default;
const { wrap } = require('topilot');

test.describe("${fixtureName}", () => {
    test("setup", wrap(setup));
    test("teardown", wrap(teardown));
});
        `;
  await writeFile(testFileName, content);
  return testFileName;
}

async function createConfig() {
  await writeFile(
    "playwright.config.js",
    `
const config = require('../../playwright.config');
    
config.testDir = './node_modules/.topilot';

module.exports = config;
`
  );
}

export default function playFixture() {
  inquirer
    .prompt([
      /* Pass your questions in here */
      {
        type: "list",
        name: "fixture",
        message: "Which fixture you want to run?",
        choices: fixtures,
      },
      {
        type: "list",
        name: "method",
        message: "Which method you want to run?",
        choices: ["setup", "teardown"],
      }
    ])
    .then(async (answers) => {
      await createConfig();
      const testFileName = await createTestOfFixture(answers);
      await playTest(testFileName, answers.method);
    })
    .catch((error) => {
      if (error.isTtyError) {
        // Prompt couldn't be rendered in the current environment
      } else {
        console.log(error);
        // Something else went wrong
      }
    });
}