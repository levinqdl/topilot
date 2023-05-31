import { push, pull } from "./api/fixture";

type FixtureFn = (
  fixtures: any,
  use: (value: any) => Promise<void>
) => Promise<void>;
interface Fixture {
  name: string;
  setup: (fixtures: any) => Promise<any>;
  teardown: (state: any) => Promise<any>;
}
export function getFixtureFn({ name, setup, teardown }: Fixture): FixtureFn {
  return async (fixtures, use) => {
    let state: any = process.env.CI ? {} : await pull();
    let value = state?.[name];
    let setupped = false;
    if (!value) {
      state = await setup(fixtures);
      value = state?.[name];
      setupped = true;
      console.log(`topilot: setup ${name} ${JSON.stringify(value)}`);
    } else {
      console.log(`topilot: pull ${name} ${JSON.stringify(value)}`);
    }
    await use(value);
    if (setupped) {
      const nextValue = await teardown({ ...fixtures, ...state, [name]: value });
      if (!process.env.CI) {
        await push(nextValue);
        console.log(`topilot: push ${JSON.stringify(nextValue)}`);
      }
    }
  };
}
