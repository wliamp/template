import * as core from '@actions/core'
import * as fs from 'fs'
import * as path from 'path'
import * as glob from 'glob'
import * as github from "@actions/github"

async function run() {
    const SCOPE = core.getInput("scope", {required: true})
    const SERVICE = core.getInput("service", {required: true})
    const PAT = core.getInput("pat", {required: true})
    const TLD = core.getInput("tld", {required: true})
    const ORG = core.getInput("org", {required: true})
    const octokit = github.getOctokit(PAT)
    const {owner, repo} = github.context.repo
    const scopes = SCOPE.toUpperCase().replace(/-/g, "_")
    let services: string[] = []
    try {
        const resp = await octokit.rest.actions.getRepoVariable({
            owner,
            repo,
            name: scopes
        })
        services = JSON.parse(resp.data.value)
    } catch (err: any) {
        if (err.status === 404) return
        else throw err
    }
    if (services.includes(SERVICE)) return
    services.push(SERVICE)
    services.sort()
    await octokit.rest.actions.createOrUpdateRepoVariable({
        owner,
        repo,
        name: scopes,
        value: JSON.stringify(services)
    })
    const corePath = path.resolve("core")
    const tempCorePath = path.join(process.env.RUNNER_TEMP || "/tmp", "core")
    fs.cpSync(corePath, tempCorePath, {recursive: true})
    process.chdir(tempCorePath)
    const packageName = `${TLD}.${ORG}.${SCOPE.replace(/-/g, ".")}.${SERVICE.replace(/-/g, ".")}`
    const packagePath = packageName.replace(/\./g, path.sep)
    const mainDir = path.join(tempCorePath, "src/main/java", packagePath)
    const testDir = path.join(tempCorePath, "src/test/java", packagePath)
    fs.mkdirSync(mainDir, {recursive: true})
    fs.mkdirSync(testDir, {recursive: true})
    const mainName = "Main"
    const mainClass = `
package ${packageName};

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class ${mainName} {
  public static void main(String[] args) {
    SpringApplication.run(${mainName}.class, args);
  }
}
`
    const testName = "Test"
    const testClass = `
package ${packageName};

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;

@SpringBootTest
class ${testName} {
  @Test
  void contextLoads() {
  }
}
`
    fs.writeFileSync(path.join(mainDir, `${mainName}.java`), mainClass, "utf8")
    fs.writeFileSync(path.join(testDir, `${testName}.java`), testClass, "utf8")
    const filePatterns = ['**/*.gradle', '**/*.yml', '**/*.toml']
    const replacements = {
        module: `${SCOPE}-${SERVICE}`,
    }
    for (const pattern of filePatterns) {
        for (const file of glob.sync(pattern, {absolute: true})) {
            if (!fs.statSync(file).isFile()) continue
            let content = fs.readFileSync(file, 'utf8')
            for (const [key, value] of Object.entries(replacements)) {
                const regex = new RegExp(`<${key}>`, 'g')
                content = content.replace(regex, value)
            }
            fs.writeFileSync(file, content, 'utf8')
        }
    }
}

run().catch((error: any) => core.setFailed(error.message))
