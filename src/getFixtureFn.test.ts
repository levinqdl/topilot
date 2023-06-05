import { getFixtureFn } from './getFixtureFn';
import { beforeEach, expect, test, vi } from 'vitest';
import * as fixtureApi from './api/fixture';
import skippedTeardowns from './skippedTeardowns';

vi.mock('./api/fixture', () => ({
    pull: vi.fn().mockResolvedValue({}),
    push: vi.fn(),
}));

vi.mock('./skippedTeardowns', () => ({
    default: new Set(),
}));

beforeEach(() => {
    vi.resetAllMocks();
});

test('getFixtureFn should call setup and teardown functions and push the next value to state', async () => {
    const name = 'foo';
    const value = 'bar';
    const fixtures = { baz: 'qux' };
    const setup = vi.fn().mockResolvedValue({ [name]: value });
    const teardown = vi.fn().mockResolvedValue({ [name]: value.toUpperCase() });
    const use = vi.fn();

    await getFixtureFn({ name, setup, teardown })(fixtures, use);

    expect(setup).toHaveBeenCalledWith(fixtures);
    expect(teardown).toHaveBeenCalledWith({ ...fixtures, [name]: value });
    expect(use).toHaveBeenCalledWith(value);
    expect(use).toHaveBeenCalledTimes(1);
    expect(teardown).toHaveBeenCalledTimes(1);
    expect(setup).toHaveBeenCalledTimes(1);
});

test('getFixtureFn should call pull and use the value from state if it exists', async () => {
    const name = 'foo';
    const value = 'bar';
    const fixtures = { baz: 'qux' };
    const use = vi.fn();

    const setup = vi.fn().mockResolvedValue({ [name]: value });

    await getFixtureFn({ name, setup: setup, teardown: vi.fn() })(fixtures, use);

    expect(fixtureApi.pull).toHaveBeenCalled();
    expect(use).toHaveBeenCalledWith(value);
    expect(use).toHaveBeenCalledTimes(1);
});

test('getFixtureFn should not call push if the value was pulled from state', async () => {
    const name = 'foo';
    const value = 'bar';
    const fixtures = { baz: 'qux' };
    const push = vi.fn();
    const use = vi.fn();

    await getFixtureFn({ name, setup: vi.fn(), teardown: vi.fn() })(fixtures, use);

    expect(fixtureApi.pull).toHaveBeenCalled();
    expect(push).not.toHaveBeenCalled();
});

test('getFixtureFn should not call pull if running on CI', async () => {
    process.env.CI = 'true';
    const name = 'foo';
    const value = 'bar';
    const fixtures = { baz: 'qux' };
    const use = vi.fn();

    await getFixtureFn({ name, setup: vi.fn(), teardown: vi.fn() })(fixtures, use);

    expect(use).toHaveBeenCalledWith(undefined);
    expect(use).toHaveBeenCalledTimes(1);
    expect(fixtureApi.pull).not.toHaveBeenCalled();
    expect(fixtureApi.push).not.toHaveBeenCalled();
    process.env.CI = undefined;
});

test('getFixtureFn should not call teardown if a test requring the fixture failed', async () => {
    const name =  'foo'
    const fixtures = { baz: 'qux'}
    const use = vi.fn()
    skippedTeardowns.add('foo')

    const teardown = vi.fn();
    await getFixtureFn({ name, setup: vi.fn(), teardown: teardown })(fixtures, use);

    expect(teardown).not.toHaveBeenCalled();
})