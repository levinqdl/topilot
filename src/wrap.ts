import { getFixtures } from "./getFixtures";
import { push } from "./api/fixture";
import skippedTeardowns from "./skippedTeardowns";

const wrap = (fn: (...args: any) => any, options: unknown) => {
  const wrapper = async (fixtureValues: any, info: any) => {
    const fixtures = getFixtures(info.fn) ?? [];
    for (const fixture of fixtures) {
      skippedTeardowns.add(fixture);
    }
    const value = await fn(fixtureValues, options, info);
    await push(value);
  };
  wrapper.toString = () => fn.toString();
  return wrapper;
};

export default wrap;
