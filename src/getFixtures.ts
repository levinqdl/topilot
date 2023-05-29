export function getFixtures(f: any) {
    return f[Object.getOwnPropertySymbols(f)[0]];
  }
  