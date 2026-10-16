"""Reject non-SemVer tags, wrong checkouts, and tags outside main."""
import argparse
import re
import subprocess

NUMBER = r"(?:0|[1-9][0-9]*)"
IDENTIFIER = rf"(?:{NUMBER}|[0-9]*[A-Za-z-][0-9A-Za-z-]*)"
SEMVER = re.compile(rf"v{NUMBER}\.{NUMBER}\.{NUMBER}(?:-{IDENTIFIER}(?:\.{IDENTIFIER})*)?(?:\+[0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*)?")


def verify(tag, main_ref="refs/remotes/origin/main", cwd=None):
    if not SEMVER.fullmatch(tag):
        raise ValueError("Release tags must be SemVer, for example v1.2.3 or v1.2.3-rc.1.")

    def git(*args):
        return subprocess.check_output(["git", *args], cwd=cwd, text=True).strip()

    commit = git("rev-parse", "--verify", f"refs/tags/{tag}^{{commit}}")
    if git("rev-parse", "HEAD") != commit:
        raise ValueError("The checkout must match the requested tag commit.")
    subprocess.run(["git", "merge-base", "--is-ancestor", commit, main_ref], cwd=cwd, check=True)
    return commit


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("tag")
    args = parser.parse_args()
    print(f"Verified {args.tag}: {verify(args.tag)} is on main")
