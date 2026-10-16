# Security reports

Use the repository's **Security → Report a vulnerability** page for private reports when private vulnerability reporting is enabled.
Do not post credentials or private recordings in a public issue.

Include the affected commit, reproduction steps, and the expected behavior.
The app runs locally and has no remote update API. The research viewer server is a development tool.

## Publication checks

`make check` checks public file names, retired project names, and common credential patterns.
CI also runs Gitleaks against the complete Git history and current files.
The scanner redacts credential values in its output.

Keep credentials in ignored local files or environment variables.
If a credential enters Git history, revoke it and replace it before publication.
Use `python3 scripts/export_public.py` to prepare a copy without this checkout's history.
