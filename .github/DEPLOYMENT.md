# Vercel Deployment Setup

This document describes how to set up automated deployments to Vercel via GitHub Actions.

## Required Secrets

Add these secrets to your GitHub repository (Settings → Secrets and variables → Actions):

| Secret | Description | How to Get |
|--------|-------------|------------|
| `VERCEL_TOKEN` | Vercel API token | [Vercel Dashboard](https://vercel.com/account/tokens) → Create Token |
| `VERCEL_ORG_ID` | Your Vercel team/org ID | See below |
| `VERCEL_PROJECT_ID` | Your Vercel project ID | See below |

## Getting Vercel IDs

1. Install Vercel CLI:
   ```bash
   pnpm add -g vercel
   ```

2. Link your project (run in project root):
   ```bash
   vercel link
   ```

3. This creates `.vercel/project.json` with your IDs:
   ```json
   {
     "orgId": "team_xxxxxxxxxxxx",
     "projectId": "prj_xxxxxxxxxxxx"
   }
   ```

4. Add these values as GitHub secrets.

## Workflow Behavior

- **Pull Requests**: Deploys a preview environment and comments the URL on the PR
- **Push to main**: Deploys to production

## Environment Variables

Set these in Vercel Dashboard (Project Settings → Environment Variables):

| Variable | Environment | Description |
|----------|-------------|-------------|
| `POSTGRES_URL` | Production | PostgreSQL connection string |
| `JWT_SECRET` | Production | JWT signing secret (generate with `openssl rand -hex 32`) |
| `ENCRYPTION_MASTER_KEY` | Production | Photo encryption key (64 hex chars) |
| `CSRF_SECRET` | Production | CSRF token signing secret |
| `BETA_MODE` | All | `private`, `waitlist`, or `open` |
| `ADMIN_EMAILS` | All | Comma-separated admin emails |
| `RESEND_API_KEY` | Production | Resend API key for emails |

## Manual Deployment

If you prefer manual deployments:

```bash
# Preview
vercel

# Production
vercel --prod
```

## Troubleshooting

### Build Fails with Type Errors
The workflow has `continue-on-error: true` for type checking due to known pre-existing errors. These should be fixed eventually.

### Preview URL Not Appearing
Check that the GitHub token has permission to comment on issues/PRs.

### Production Deploy Stuck
Verify all required environment variables are set in Vercel.
