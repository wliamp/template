import * as core from "@actions/core";
import * as fs from "fs";
import * as path from "path";
import * as yaml from "js-yaml";
import * as github from "@actions/github";

async function run() {
  try {
    const SCOPE = core.getInput("scope", { required: true });
    const initServicePath = path.resolve(".github/workflows/init-service.yml");
    const yamlText = fs.readFileSync(initServicePath, "utf8");
    const doc: any = yaml.load(yamlText);
    if (doc.on?.workflow_dispatch?.inputs?.SCOPE) {
      const scopeInput = doc.on.workflow_dispatch.inputs.SCOPE;
      const yamlScopes: string[] = Array.isArray(scopeInput.options)
        ? scopeInput.options
        : [];
      yamlScopes.push(SCOPE);
      yamlScopes.sort();
      scopeInput.options = yamlScopes;
      scopeInput.default = yamlScopes[0];
    }
    fs.writeFileSync(initServicePath, yaml.dump(doc, { noRefs: true }), "utf8");
  } catch (error: any) {
    core.setFailed(error.message);
  }
}

run();
