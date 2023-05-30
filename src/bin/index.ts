#!/usr/bin/env node
import { Command } from "commander";
import playFixture from "./playFixture";
import child_process from "child_process";
import util from "util";
import { push } from "../api/case";
import { getCurrentBranch } from "../api/getCurrentBranch";

const exec = util.promisify(child_process.exec);

const program = new Command();

program
  .command("push")
  .description("Push tests to topilot")
  .action(async () => {
    const {stdout} = await exec("npx playwright test --list --reporter "+__dirname+"/reporter.js");
    const { tests }= JSON.parse(stdout);
    const branch = await getCurrentBranch();
    
    console.log(`Pushing ${tests.length} tests to topilot from branch ${branch}.`);
    await push(branch, tests)
  });

program.parse(process.argv);

if (program.args.length === 0) {
  playFixture();
}
