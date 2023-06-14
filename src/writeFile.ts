import path from "path";
import fs from "fs";
import { mkdirp } from "mkdirp";

export async function writeFile(testFileName: any, content: any) {
    const relativePath = path.join("node_modules", ".topilot", testFileName);
    const folderPath = path.dirname(relativePath);
    await mkdirp(folderPath);
    fs.writeFileSync(relativePath, content);
}
