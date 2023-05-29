import { globSync } from "glob";

export default globSync("**/*.fixture.{ts,js}", {
  cwd: process.cwd(),
  ignore: ["**/node_modules/**"],
});
