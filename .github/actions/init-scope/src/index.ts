import * as core from "@actions/core";
import * as fs from "fs";
import * as path from "path";

function readLines(file: string): string[] {
  if (!fs.existsSync(file)) return [];
  return fs.readFileSync(file, "utf8").split(/\r?\n/);
}

function writeLines(file: string, lines: string[]) {
  fs.writeFileSync(file, lines.join("\n"));
}

async function run() {
  try {
    const scope = core.getInput("scope", { required: true });
    const alias = core.getInput("alias", { required: true });
    const initService = path.resolve(".github/workflows/init-service.yml");
    const mapFile = path.resolve("scopes");

    const scopes = mapFile.map(l => l.split("=")[0]);
    const defaultScope = scopes[0];
    const scopesYaml = scopes.map(s => `          - ${s}`);

    const initLines = readLines(initService);
    const out: string[] = [];
    let inScope = false;
    for (const line of initLines) {
      if (/^ +scope:/.test(line)) {
        out.push(line);
        inScope = true;
        continue;
      }
      if (inScope && /default:/.test(line)) {
        out.push(`        default: ${defaultScope}`);
        continue;
      }
      if (inScope && /options:/.test(line)) {
        out.push("        options:");
        out.push(...scopesYaml);
        inScope = false;
        continue;
      }
      out.push(line);
    }
    writeLines(initService, out);
  } catch (error: any) {
    core.setFailed(error.message);
  }
}

run();
