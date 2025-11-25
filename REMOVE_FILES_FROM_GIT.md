# How to Remove .md and .sql Files from Git (But Keep Locally)

## Option 1: Remove Specific Files from Git (Recommended)

If you want to remove only certain files:

```bash
# Remove from git but keep locally
git rm --cached *.md
git rm --cached *.sql

# Commit the removal
git commit -m "chore: remove documentation and SQL files from repository"

# Push to GitHub
git push origin main
```

## Option 2: Add to .gitignore and Remove from Git

If you want to exclude ALL .md and .sql files from future commits:

1. Add to `.gitignore`:
```
# Documentation files
*.md
!README.md  # Keep README.md if you want

# SQL migration files
*.sql
```

2. Remove from git (but keep locally):
```bash
git rm --cached *.md
git rm --cached *.sql
git commit -m "chore: exclude .md and .sql files from repository"
git push origin main
```

## Option 3: Keep Important Files, Remove Others

If you want to keep some files but remove others:

```bash
# Remove specific files
git rm --cached BUNDLE_OPTIMIZATION.md
git rm --cached DEPLOYMENT_CHECKLIST.md
# ... etc

# Keep important ones like README.md, SETUP.md
# Don't remove those

git commit -m "chore: remove unnecessary documentation files"
git push origin main
```

## Important Notes

- `git rm --cached` removes files from git tracking but keeps them on your local disk
- After removing, add patterns to `.gitignore` to prevent them from being added again
- If you remove SQL files, make sure you have backups or another way to track database migrations

## Recommendation

**Keep these files in the repo** - they're useful for:
- Documentation for other developers
- Database migration history
- Setup instructions
- Deployment guides

But if you have sensitive information in any .md or .sql files, definitely remove those!

