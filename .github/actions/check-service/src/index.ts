import * as core from "@actions/core";
import * as fs from "fs";
import * as path from "path";

async function run() {
  try {
    const SCOPE = core.getInput("scope", { required: true });
    const SERVICE = core.getInput('service', { required: true });
    const PAT = core.getInput("pat", { required: true });
    const octokit = github.getOctokit(PAT);
    const { owner, repo } = github.context.repo;
    const scopes = SCOPE.toUpperCase().replace(/-/g, "_");
    let services: string[] = [];
    try {
      const resp = await octokit.rest.actions.getRepoVariable({
        owner,
        repo,
        name: scopes
      });
      services = JSON.parse(resp.data.value);
    } catch (err: any) {
      if (err.status === 404) return;
      else throw err;
    }
    if (services.includes(SERVICE)) return;
    services.push(SERVICE);
    services.sort();
    await octokit.rest.actions.createOrUpdateRepoVariable({
      owner,
      repo,
      name: scopes,
      value: JSON.stringify(services)
    });
    core.setOutput("scope", SCOPE);
    core.setOutput("service", SERVICE);
  } catch (error: any) {
    core.setFailed(error.message);
  }
}

run();
