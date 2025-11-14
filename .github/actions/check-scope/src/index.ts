import * as core from "@actions/core";
import * as github from "@actions/github";

async function run() {
    try {
        const SCOPE = core.getInput("scope", {required: true});
        const PAT = core.getInput("pat", {required: true});
        const octokit = github.getOctokit(PAT);
        const {owner, repo} = github.context.repo;
        const scopes = SCOPE.toUpperCase().replace(/-/g, "_");
        let exists = false;
        try {
            await octokit.rest.actions.getRepoVariable({
                owner,
                repo,
                name: scopes
            });
            exists = true;
        } catch (err: any) {
            if (err.status !== 404) throw err;
        }
        if (exists) return;
        await octokit.rest.actions.createOrUpdateRepoVariable({
            owner,
            repo,
            name: scopes,
            value: JSON.stringify([])
        });
        core.setOutput("scope", SCOPE);
    } catch (error: any) {
        core.setFailed(error.message);
    }
}

run().then(() => {
});
