import { getFixtures } from "./getFixtures"
import { push } from "./api/fixture"
import skippedTeardowns from "./skippedTeardowns"

const wrap = (fn: (...args: any)=> any) => {
    const wrapper = async (...args: any) => {
    const fixtures = getFixtures(args.at(-1).fn) ?? []
        for (const fixture of fixtures) {
            skippedTeardowns.add(fixture)
        }
        const value = await fn(...args)
        await push(value)
    }
    wrapper.toString = () => fn.toString()
    return wrapper
}

export default wrap