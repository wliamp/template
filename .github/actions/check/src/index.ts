import * as core from "@actions/core";
import * as fs from "fs";
import * as path from "path";

function readLines(file: string): string[] {
  if (!fs.existsSync(file)) return [];
  return fs.readFileSync(file, "utf8").split(/\r?\n/).filter(Boolean);
}

function writeLines(file: string, lines: string[]) {
  fs.writeFileSync(file, lines.join("\n") + "\n");
}

async function run() {
  try {
    const key = core.getInput("key", { required: true });
    const value = core.getInput("value", { required: true });
    const map = core.getInput("map", { required: true });

    const mapFile = path.resolve(map);

    let mapLines = readLines(mapFile);

    const mapObj: Record<string, string> = {};
    for (const line of mapLines) {
      const [k, v] = line.split("=");
      if (k && v) mapObj[k] = v;
    }

    const existingEntry = Object.entries(mapObj).find(
      ([k, v]) => k === key || v === value
    );

    if (existingEntry) {
      const [existingKey, existingValue] = existingEntry;
      core.info(`⚠️ Entry already exists: ${existingKey}=${existingValue}`);
      core.setOutput("key", existingKey);
      core.setOutput("value", existingValue);
      return;
    }

    mapObj[key] = value;

    const sortedLines = Object.keys(mapObj)
      .sort()
      .map(k => `${k}=${mapObj[k]}`);

    writeLines(mapFile, sortedLines);

    core.info(`✅ Added entry: ${key}=${value}`);
    core.setOutput("key", key);
    core.setOutput("value", value);

  } catch (error: any) {
    core.setFailed(error.message);
  }
}

run();
