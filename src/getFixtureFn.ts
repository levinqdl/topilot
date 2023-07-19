import { push, pull } from "./api/fixture";
import parseSchema from "./bin/parseSchema";
import skippedTeardowns from "./skippedTeardowns";
import * as Zod from "zod";

type FixtureFn = (
  fixtures: any,
  use: (value: any) => Promise<void>
) => Promise<void>;

interface Fixture<TOptions = any> {
  name: string;
  setup: (fixtures: any, options: TOptions) => Promise<any>;
  teardown: (state: any) => Promise<any>;
  schema?: Zod.ZodType<TOptions>;
}

export function getFixtureFn({ name, setup, teardown, schema }: Fixture): FixtureFn {
  return async (fixtures, use) => {
    let state: any = process.env.CI ? {} : await pull();
    let value = state?.[name];
    let setupped = false;
    if (!value) {
      let options: any = {};
      if (schema) {
        const properties = parseSchema(schema);
        options = properties.reduce<{[s: string]: any}>((acc, { name, options }) => {
          acc[name] = options[Math.floor(Math.random() * options.length)]
          return acc;
        }, {})
      }
      state = await setup(fixtures, options);
      value = state?.[name];
      setupped = true;
      console.log(`topilot: setup ${name} ${JSON.stringify(value)}`);
    } else {
      console.log(`topilot: pull ${name} ${JSON.stringify(value)}`);
    }
    await use(value);
    if (setupped && !skippedTeardowns.has(name)) {
      const nextValue = await teardown({ ...fixtures, ...state, [name]: value });
      if (!process.env.CI) {
        await push(nextValue);
        console.log(`topilot: push ${JSON.stringify(nextValue)}`);
      }
    }
  };
}
