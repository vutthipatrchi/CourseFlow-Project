# Main branch configuration

After pushing the setup branch, open a pull request to `main` and let CI run.
In GitHub repository Settings, create a branch ruleset (or branch protection
rule) targeting `main`:

- Require a pull request before merging.
- Require one approval for a team; omit approvals for a solo repository.
- Require `frontend-checks` and `backend-checks` after they first appear in CI.
- Require branches to be up to date before merging.
- Require conversation resolution.
- Block force pushes and branch deletion; apply protections to admins too.

Enable squash merging and automatically delete merged head branches.
Availability depends on repository visibility and GitHub plan.
These are GitHub server settings; committing this document does not enable them.

Use short-lived branches: `feat/...`, `fix/...`, `chore/...`.
Create features from `main`, open a PR, pass checks, review and squash merge.
A separate `develop` branch is not needed for the initial workflow.
