## 🛠 Branch Workflows

This repository follows the **Semi-GitFlow** branching model -> Domain-Dev.

### 🏗 Branch Structure

`main` → Domain Logic-ready code, always stable.

`feature/*` → For developing new features. Branch off from `main`, merge back into `main`.

`bugfix/*` → For fixing reported issues (non-critical, not blocking production). Must originate from a tracked
issue/ticket. Branch off from `main`, merge back into `main`.

`hotfix/*` → For urgent/critical fixes in production. Branch off from `main`.

### 🔄 Workflow Summary

#### ✨ Feature Development

Create a `feature/*` branch from `main`.
Used for new functionality.
Merge back into `main`.
If a bug appears during feature development, it is resolved inside the same `feature/*` (not a separate `bugfix/*`).

#### 🐞 Bug Fixing

Create a `bugfix/*` from `main` to address a known issue (originating from an Issue Tracker).
Merge back into `main` after review.

#### 🔥 Hotfix for Production

For critical issues in production, create a `hotfix/*` from `main`.
After fixing:
Merge into `main` → deploy immediately.

#### 📊 Visual

```mermaid
gitGraph
    commit id: "main init"
    branch feature/login
    checkout feature/login
    commit id: "feat: login"
    commit id: "fix minor bug in login"
    checkout main
    merge feature/login id: "merge feature/login"
    branch bugfix/issue-123
    checkout bugfix/issue-123
    commit id: "fix: issue-123 (non-critical)"
    checkout main
    merge bugfix/issue-123 id: "merge bugfix"
    branch hotfix/critical-crash
    checkout hotfix/critical-crash
    commit id: "hotfix: critical crash in prod"
    checkout main
    merge hotfix/critical-crash id: "deploy hotfix"
    commit id: "main stable after hotfix"
```

---

## 📝 Commit Message

#### Conventional Commit

```
<type>: <message>
```

#### Type

- `feat` → add feature
- `fix` → bug fix / hot fix
- `docs` → edit documentation
- `style` → change code format/style (does not affect logic)
- `refactor` → edit code but do not add feature, do not fix bug
- `test` → add/edit test
- `chore` → miscellaneous (update dependency, config)

**E.g.**

```
feat: expose callback api
fix: incorrect payment calculation
docs: update README
style: reactive pipeline insteand of imperative code
refactor: optimize structure classes and funtions
test: issuer forward
chore: bump version 1.2.0
```

---

## 🛡 Branch Protection Rules

#### ⚙️ Workflows

- **Applied** `main`
- **Restrict** `creations` | `deletions` | `force pushes`
- **Required**
    - `signed commit`
    - `pull request`
        - required approvals: 1
        - dismiss stale approvals when new commits are pushed
        - conversation resolution before merging
        - allowed merge: *Squash*
    - `status checks`
        - up to date before merging
        - required: *develop*

#### ✍️ Working

- **Applied** `feature/*` | `bugfix/*` | `hotfix/*`
- **Required** `signed commit`

---

## 🧩 Continuous Integration

1. **Trigger**: `pull_request` → `main`
2. **Steps**:

- **Dependency Caching**: Restore cached dependencies for faster build times.
- **Static & Security Analysis**:
    - **Static checks**: code style, linting, and type validation.
    - **SAST (Static Application Security Testing)**: detect code vulnerabilities.
    - **Dependencies**: vulnerability scanning.
- **Testing & Building**: Run unit tests, build modules, and generate coverage reports.
- **Artifact Upload**: Upload test, coverage, and build artifacts to the CI server.

3. **Visual**

```mermaid
flowchart TD
subgraph Stage1["Trigger & Validation"]
A1[Pull Request → main] --> A2[Validate branch naming & structure]
end
subgraph Stage2["Dependency & Security Analysis"]
A3[Restore cached dependencies]
A4[Static checks: lint, format, type validation]
A5[SAST: Static Application Security Testing]
A6[Dependency vulnerability scanning]
end
subgraph Stage3["Build & Test"]
A7[Run Unit tests]
A8[Build modules & generate coverage reports]
end
subgraph Stage4["Artifact & Reporting"]
A9[Upload test, coverage, and build artifacts]
A10[Publish reports to CI server]
end
A2 --> A3
A3 --> A4 --> A5 --> A6 --> A7 --> A8 --> A9 --> A10
```
