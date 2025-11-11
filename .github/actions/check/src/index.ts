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
    const KEY = core.getInput("key", { required: true });
    const VALUE = core.getInput("value") || '';
    const MAP = core.getInput("map", { required: true });
    const mapFile = path.resolve(MAP);
    let mapLines = readLines(mapFile);
    const mapObj: Record<string, string> = {};
    for (const line of mapLines) {
      const [k, v] = line.split("=");
      if (k && v) mapObj[k] = v;
    }
    const existingEntry = Object.entries(mapObj).find(
      ([k, v]) => k === KEY || v === VALUE
    );
    if (existingEntry) {
      const [existingKey, existingValue] = existingEntry;
      core.setOutput("key", existingKey);
      core.setOutput("value", existingValue);
      return;
    }
    mapObj[KEY] = VALUE;
    const sortedLines = Object.keys(mapObj)
      .sort()
      .map(k => `${k}=${mapObj[k]}`);
    writeLines(mapFile, sortedLines);
    core.setOutput("key", KEY);
    core.setOutput("value", VALUE);
  } catch (error: any) {
    core.setFailed(error.message);
  }
}

run();
