import inquirer from "inquirer";
import child_process from "child_process";
import { writeFile } from "../writeFile.js";
import fixtures from "../fixtures";

import path from "path";
import parseSchema from "./parseSchema";
import { requireSchema } from "./requireSchema";

async function playTest(testFileName: any, title: string) {
  const child = await child_process.spawn(
    "npx",
    [
      "playwright",
      "test",
      "-c",
      "node_modules/.topilot/playwright.config.js",
      "--project=chromium",
      "--reporter=line",
      path.join("node_modules", ".topilot", testFileName).replace(/\\/g, "/"),
      "-g",
      title,
    ],
    { shell: process.platform === "win32" }
  );
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

async function createTestOfFixture(fixture: string, options: unknown) {
  const testFileName = fixture.replace(".fixture.ts", ".test.js");

  const content = `
const { setup, teardown, name } = require(${JSON.stringify(
    path.join(process.cwd(), fixture.replace(".ts", ""))
  )});
const test = require('topilot').default;
const { wrap } = require('topilot');

const options = ${JSON.stringify(options)};

test.describe(name, () => {
    test("setup", wrap(setup, options));
    test("teardown", wrap(teardown, options));
});
`;
  await writeFile(testFileName, content);
  return testFileName;
}

async function createConfig() {
  await writeFile(
    "playwright.config.js",
    `
const config = require(${JSON.stringify(
      path.join("..", "..", "playwright.config")
    )});
    
config.testDir = ${JSON.stringify(path.join(".", "node_modules", ".topilot"))};

module.exports = config;
`
  );
}

export default async function playFixture() {
  try {
    const { fixture, method } = await inquirer.prompt([
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
      },
    ]);

    let options: any = {};
    if (method === "setup") {
      const {schema} = requireSchema(fixture);
      const properties = await parseSchema(schema);
      for (const {name, options: choices} of properties) {
        options = await inquirer.prompt([
          {
            type: "list",
            name,
            message: `Which ${name} you want to run?`,
            choices,
          },
        ]);
      }
    }
    await createConfig();
    const testFileName = await createTestOfFixture(fixture, options);
    await playTest(testFileName, method);
  } catch (error: any) {
    if (error.isTtyError) {
      // Prompt couldn't be rendered in the current environment
    } else {
      console.log(error);
      // Something else went wrong
    }
  }
}
