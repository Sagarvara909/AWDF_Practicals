# Practical 12: CI Pipeline with GitHub Actions

## Objective

Run automated quality checks on pushes to `main` and use the Actions result to
identify a broken test and confirm its correction.

## Workflow

The workflow is at
[`../../.github/workflows/ci.yml`](../../.github/workflows/ci.yml). Because the
application is inside the `student-portfolio` directory of the repository,
each npm command runs from that directory. The workflow uses Node.js 22, which
is compatible with this project’s Vite version.

1. The `lint` job checks out the repository, installs the application
   dependencies, and runs `npm run lint`.
2. The `test` job waits for lint to pass, installs dependencies, runs
   `npm test`, and builds the frontend with `npm run build`.
3. A nonzero command exit marks its job and the workflow as failed; all
   successful jobs produce a passing workflow result.

The existing Node.js test suite includes real HTTP integration tests, including
`GET /tasks`; it does not need Jest or Supertest. Run the same checks locally
from `student-portfolio` with:

```sh
npm install
npm run lint
npm test
npm run build
```

The workflow runs for pushes to `main` and can also be started manually from
the Actions tab. It does not deploy the application.

## Demonstrate a failure and recovery

To capture the required failed and passing runs:

1. Push the workflow to GitHub and open the repository’s **Actions** tab.
2. In `server/tasks.test.js`, temporarily change the expected status in the
   `GET /tasks returns the initial task list` test from `200` to `201`.
3. Push that deliberately incorrect expectation to `main`. Open the new
   **CI Pipeline** run and inspect the failed test output in the **Test and
   build** job.
4. Capture a screenshot showing the failed run and its test failure.
5. Restore the expected status to `200`, commit, and push the correction.
6. Capture a screenshot of the passing run, showing both jobs succeeded.

Save both genuine GitHub Actions screenshots in this `docs` folder and link
them here when available. Screenshots cannot be produced until the workflow is
pushed and the runs are visible in the repository’s Actions tab. Do not treat a
locally simulated failure as evidence of a GitHub Actions run.

## Analysis

- **CI vs. CD:** Continuous Integration automatically validates changes as
  they are integrated. Continuous Deployment additionally releases validated
  changes to an environment. This workflow demonstrates CI; it does not
  deploy.
- **Why test on every push?** Automated checks provide quick, repeatable
  feedback while the change is small and visible in the commit that introduced
  it. Manual pre-release testing can miss regressions and delays discovery.
- **Incorrect test path vs. failing assertion:** Both make `npm test` exit
  unsuccessfully and fail the same workflow step. The logs differ: an
  incorrect path reports that the test file cannot be found, while a genuine
  failed assertion identifies the test and the expected/actual values.

## Evidence

- Failed GitHub Actions run: capture after completing steps 1–4 above.
- Passing GitHub Actions run: capture after completing steps 5–6 above.
