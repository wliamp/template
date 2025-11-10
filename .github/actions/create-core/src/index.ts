import * as core from '@actions/core';
import * as fs from 'fs';
import * as path from 'path';
import * as glob from 'glob';

async function run() {
  try {
    const SCOPE = core.getInput('scope', { required: true });
    const SERVICE = core.getInput('service', { required: true });
    const ALIAS = core.getInput('alias', { required: true });
    const TLD = core.getInput('tld', { required: true });
    const ORG = core.getInput('org', { required: true });

    const DIR = path.join(process.env.RUNNER_TEMP, 'core');
    const MAP_FILE = path.resolved("scopes");
    const IMAGE = `${SCOPE}-${SERVICE}`;

    process.chdir(DIR);

    let SCOPE_ALIAS = '';
    if (fs.existsSync(MAP_FILE)) {
      const lines = fs.readFileSync(MAP_FILE, 'utf8').split(/\r?\n/);
      for (const line of lines) {
        const match = line.match(new RegExp(`^${SCOPE}=(.*)$`));
        if (match) {
          SCOPE_ALIAS = match[1].trim();
          break;
        }
      }
    }

    const moveDir = (src: string, dest: string) => {
      if (src === dest) return;
      if (!fs.existsSync(src)) return;
      const parent = path.dirname(dest);
      fs.mkdirSync(parent, { recursive: true });

      if (fs.existsSync(dest)) {
        for (const file of fs.readdirSync(src)) {
          const from = path.join(src, file);
          const to = path.join(dest, file);
          fs.renameSync(from, to);
        }
        try { fs.rmdirSync(src); } catch { /* ignore */ }
      } else {
        fs.renameSync(src, dest);
      }
    };

    const findDirs = (pattern: string) => glob.sync(pattern, { nodir: false, absolute: true });

    if (SCOPE_ALIAS) {
      for (const dir of findDirs(`**/src/**/${TLD}/${ORG}/alias1`)) {
        const parent = path.dirname(dir);
        const newdir = path.join(parent, SCOPE_ALIAS);
        moveDir(dir, newdir);
      }

      for (const dir of findDirs(`**/src/**/${TLD}/${ORG}/${SCOPE_ALIAS}/alias2`)) {
        const parent = path.dirname(dir);
        const newdir = path.join(parent, ALIAS);
        moveDir(dir, newdir);
      }

      for (const dir of findDirs(`**/src/**/${TLD}/${ORG}/alias1/alias2`)) {
        const alias1Dir = path.dirname(dir);
        const targetAlias1Dir = alias1Dir.replace(/alias1$/, SCOPE_ALIAS);
        const targetAlias2Dir = path.join(targetAlias1Dir, ALIAS);

        moveDir(alias1Dir, targetAlias1Dir);
        const alias2Dir = path.join(targetAlias1Dir, 'alias2');
        if (fs.existsSync(alias2Dir)) moveDir(alias2Dir, targetAlias2Dir);
      }
    }

    const filePatterns = ['**/*.java', '**/*.gradle', '**/*.yml', '**/*.toml'];
    const replacements = {
      module: IMAGE,
      alias1: SCOPE_ALIAS,
      alias2: ALIAS,
    };

    for (const pattern of filePatterns) {
      for (const file of glob.sync(pattern, { absolute: true })) {
        if (!fs.statSync(file).isFile()) continue;
        let content = fs.readFileSync(file, 'utf8');
        for (const [key, value] of Object.entries(replacements)) {
          const regex = new RegExp(`<${key}>`, 'g');
          content = content.replace(regex, value);
        }
        fs.writeFileSync(file, content, 'utf8');
      }
    }
  } catch (error: any) {
    core.setFailed(error.message);
  }
}

run();
