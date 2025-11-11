import * as core from "@actions/core";
import * as fs from "fs";
import * as path from "path";
import * as yaml from "js-yaml";

async function run() {
  try {
    const SCOPE = core.getInput("scope", { required: true });
    const initServicePath = path.resolve(".github/workflows/init-service.yml");
    const map = path.resolve("scopes");
    const mapLines = fs.existsSync(map)
      ? fs.readFileSync(map, "utf8").split(/\r?\n/).filter(Boolean)
      : [];
    const scopes = mapLines.map(line => line.split("=")[0]);
    const defaultScope = scopes[0] || "default";
    const yamlText = fs.readFileSync(initServicePath, "utf8");
    const doc: any = yaml.load(yamlText);
    if (doc.on?.workflow_dispatch?.inputs?.SCOPE) {
      const scopeInput = doc.on.workflow_dispatch.inputs.SCOPE;
      scopeInput.default = defaultScope;
      scopeInput.options = scopes;
      const updatedYaml = yaml.dump(doc, { noRefs: true });
      fs.writeFileSync(initServicePath, updatedYaml, "utf8");
    }
    fs.writeFileSync(initServicePath, yaml.dump(doc, { noRefs: true }));
  } catch (error: any) {
    core.setFailed(error.message);
  }
}

run();
