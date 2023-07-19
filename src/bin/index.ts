#!/usr/bin/env node
import { Command } from "commander";
import playFixture from "./playFixture";
import child_process from "child_process";
import util from "util";
import { push } from "../api/case";
import { getCurrentBranch } from "../api/getCurrentBranch";
import inquirer from "inquirer";
import { groupBy, uniqBy } from "lodash";
import fixtures from "../fixtures";
import { requireSchema } from "./requireSchema";
import { zodToJsonSchema } from "zod-to-json-schema";
const TreePrompt = require("inquirer-tree-prompt");

const exec = util.promisify(child_process.exec);

const program = new Command();

program
  .command("push")
  .description("Push tests to topilot")
  .option("-i, --interactive", "select key cases interactively")
  .action(async (options) => {
    const { stdout } = await exec(
      "npx playwright test --list --reporter " + __dirname + "/reporter.js"
    );
    let { tests } = JSON.parse(stdout);

    const fixtureSchemas: any = {}
    fixtures.forEach((fixture) => {
      const {name, schema} = requireSchema(fixture);
      if (schema)
        fixtureSchemas[name] = zodToJsonSchema(schema);
    });
    const branch = await getCurrentBranch();

    if (options.interactive) {
      tests = await selectKeyCases(tests);
    }

    console.log(
      `Pushing ${tests.length} tests to topilot from branch ${branch}.`
    );
    await push(branch, {tests, fixtures: fixtureSchemas});
  });
program
  .command("play")
  .description("Play fixtures")
  .action(() => {
    playFixture();
  });

program.parse(process.argv);

interface Test {
  title: string[];
  file: string;
  testIds: string[];
  selected?: boolean;
}

function selectKeyCases(tests: Test[]) {
  const tree = getTree(tests);
  console.clear();
  inquirer.registerPrompt("tree", TreePrompt);
  return inquirer
    .prompt([
      {
        type: "tree",
        message: "select key cases",
        name: "keyCases",
        tree,
        multiple: true,
        pageSize: 20,
      },
    ])
    .then((answers) => {
      const keyCases = uniqBy(answers.keyCases.flat(), (test: Test) =>
        test.testIds.join(" ")
      );
      for (const t of tests) {
        if (
          keyCases.some(
            (test: Test) => test.testIds.join(" ") === t.testIds.join(" ")
          )
        ) {
          t.selected = true;
        } else {
          t.selected = false;
        }
      }
      return tests;
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

function getTree(tests: Test[]) {
  const groups = groupBy(tests, (test) => test.file);
  return Object.keys(groups).map((file) => {
    const tests = groups[file];
    return {
      name: file,
      children: groupTestInFileByTitle(tests, 0),
      value: tests,
      open: true,
    };
  });
}

function groupTestInFileByTitle(
  tests: Test[],
  depth: number
): { name: string; value: Test[]; children?: unknown[] }[] {
  if (tests.length === 0) {
    return [];
  }
  const groups = Object.entries(groupBy(tests, (test) => test.title[0])).map(
    ([title, tests]) => {
      if (tests.length === 1 && tests[0].title.length === 1) {
        return {
          name: tests[0].title[0],
          value: tests,
        };
      } else {
        return {
          name: title,
          open: true,
          value: tests,
          children: groupTestInFileByTitle(
            tests.map((test: Test) => {
              return {
                ...test,
                title: test.title.slice(1),
              };
            }),
            depth + 1
          ),
        };
      }
    }
  );

  const indent = Array(depth).fill(" ").join("");
  // flatten groups with only one child
  const flattenGroups = [];
  for (const group of groups) {
    if (
      group.children &&
      group.children.length === 1 &&
      group.children[0].children
    ) {
      const child = group.children[0];
      flattenGroups.push({
        ...child,
        name:
          group.name +
          `\n\t${indent}> ` +
          group.children[0].name.replace(/\n\t\s*> /g, `\n\t${indent}> `),
        value: child.value,
      });
    } else {
      flattenGroups.push(group);
    }
  }
  return flattenGroups;
}
