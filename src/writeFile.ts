import fs from "fs";
import { mkdirp } from "mkdirp";

export async function writeFile(testFileName: any, content: any) {
    const relativePath = `.topilot/${testFileName}`;
    const folderPath = relativePath.split("/").slice(0, -1).join("/");
    await mkdirp(folderPath);
    fs.writeFileSync(relativePath, content);
}
