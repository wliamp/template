import * as core from '@actions/core'
import * as fs from 'fs'
import * as path from 'path'
import fetch from 'node-fetch'

async function run() {
  try {
    const pat = core.getInput('pat', { required: true })
    const org = core.getInput('org', { required: true })
    const repo = core.getInput('repo', { required: true })

    for (const [i, rule] of JSON.parse(fs.readFileSync(path.resolve("ruleset.json"), 'utf8')).entries()) {
      core.startGroup(`Applying ruleset #${i + 1}: ${rule.name}`)
      const response = await fetch(
        `https://api.github.com/repos/${org}/${repo}/rulesets`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${pat}`,
            Accept: 'application/vnd.github+json',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(rule),
        }
      )

      if (!response.ok) {
        const text = await response.text()
        throw new Error(`Failed to apply ruleset ${rule.name}: ${response.status} ${text}`)
      }

      core.endGroup()
    }

  } catch (error) {
    if (error instanceof Error) core.setFailed(error.message)
    else core.setFailed('Unknown error')
  }
}

run()
