import simpleGit from "simple-git";

export async function getCurrentBranch() {
  if (process.env.CI && process.env.CI_COMMIT_REF_NAME)
    return process.env.CI_COMMIT_REF_NAME;
  const git = simpleGit();
  const branchSummary = await git.branch();
  return branchSummary.current;
}
