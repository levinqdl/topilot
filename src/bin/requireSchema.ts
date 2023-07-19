import path from "path";

require("ts-node").register({ transpileOnly: true });
export function requireSchema(fixtureFile: string) {
  return require(path.join(process.cwd(), fixtureFile));
}
