export function getFixtures(f: any): string[] {
    return f[Object.getOwnPropertySymbols(f)[0]];
  }
  