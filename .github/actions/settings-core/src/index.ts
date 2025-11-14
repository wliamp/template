import * as core from '@actions/core'
import * as fs from 'fs'
import * as path from 'path'
import fetch from 'node-fetch'
import * as sodium from 'tweetsodium'

function parseMapping(raw: string) {
    const map: Record<string, string> = {}
    raw
        .split('\n')
        .map(l => l.trim())
        .filter(Boolean)
        .forEach(line => {
            const [src, dest] = line.split(':').map(s => s.trim())
            if (src && dest) map[src] = dest
        })
    return map
}

async function run() {
    const PAT = core.getInput('pat', {required: true})
    const ORG = core.getInput('org', {required: true})
    const REPO = core.getInput('repo', {required: true})
    const VARS = core.getInput('vars') || ''
    const SECRETS = core.getInput('secrets') || ''
    const TOPICS = (core.getInput('topics') || '').split(',').filter(Boolean)
    const DESC = core.getInput('desc') || ''
    const headers = {
        Authorization: `Bearer ${PAT}`,
        Accept: 'application/vnd.github+json',
        'Content-Type': 'application/json',
    }
    for (const [i, rule] of JSON.parse(fs.readFileSync(path.resolve("ruleset.json"), 'utf8')).entries()) {
        const response = await fetch(
            `https://api.github.com/repos/${ORG}/${REPO}/rulesets`,
            {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${PAT}`,
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
    }
    const varsMap = parseMapping(VARS)
    if (Object.keys(varsMap).length > 0) {
        for (const [dest, src] of Object.entries(varsMap)) {
            const value = process.env[src]
            if (!value) continue
            const res = await fetch(`https://api.github.com/repos/${ORG}/${REPO}/actions/variables`, {
                method: 'POST',
                headers,
                body: JSON.stringify({name: dest, value}),
            })
            if (res.status === 409) {
                await fetch(`https://api.github.com/repos/${ORG}/${REPO}/actions/variables/${dest}`, {
                    method: 'PATCH',
                    headers,
                    body: JSON.stringify({value}),
                })
            } else if (!res.ok) {
                const txt = await res.text()
                throw new Error(`Failed to set variable ${dest}: ${res.status} ${txt}`)
            }
        }
    }
    const secretsMap = parseMapping(SECRETS)
    if (Object.keys(secretsMap).length > 0) {
        const keyResp = await fetch(`https://api.github.com/repos/${ORG}/${REPO}/actions/secrets/public-key`,
            {headers,})
        if (!keyResp.ok) throw new Error(`Failed to get public key: ${keyResp.status}`)
        const keyData = await keyResp.json()
        const publicKey = keyData.key
        const keyId = keyData.key_id
        for (const [dest, src] of Object.entries(secretsMap)) {
            const value = process.env[src]
            if (!value) continue
            const messageBytes = Buffer.from(String(value))
            const keyBytes = Buffer.from(publicKey, 'base64')
            const encryptedBytes = sodium.seal(messageBytes, keyBytes)
            const encryptedValue = Buffer.from(encryptedBytes).toString('base64')
            const res = await fetch(`https://api.github.com/repos/${ORG}/${REPO}/actions/secrets/${dest}`, {
                method: 'PUT',
                headers,
                body: JSON.stringify({encrypted_value: encryptedValue, key_id: keyId}),
            })
            if (!res.ok) {
                const txt = await res.text()
                throw new Error(`Failed to set secret ${dest}: ${res.status} ${txt}`)
            }
        }
    }
    if (DESC) {
        await fetch(`https://api.github.com/repos/${ORG}/${REPO}`, {
            method: 'PATCH',
            headers,
            body: JSON.stringify({DESC}),
        })
    }
    if (TOPICS.length > 0) {
        await fetch(`https://api.github.com/repos/${ORG}/${REPO}/topics`, {
            method: 'PUT',
            headers,
            body: JSON.stringify({names: TOPICS}),
        })
    }
}

run().catch((error: any) => core.setFailed(error instanceof Error ? error.message : 'Unknown error'))
