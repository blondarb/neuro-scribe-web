# Neuro Scribe — Deployment Guide

**Audience:** DevOps engineers, infrastructure team
**Last updated:** 2026-02-11

---

## Prerequisites

| Requirement | Version | Notes |
|-------------|---------|-------|
| Node.js | 20+ | LTS recommended |
| PostgreSQL | 16+ | With encryption at rest enabled |
| Docker | 24+ | For containerized deployment |
| Signed BAAs | — | Anthropic, Deepgram, Auth provider, hosting |

## Quick Start (Local Development)

```bash
# 1. Clone and install
git clone https://github.com/blondarb/neuro-scribe.git
cd neuro-scribe
npm install

# 2. Configure environment
cp .env.example .env
# Edit .env with your values (see Environment Variables below)

# 3. Sync knowledge base
npm run kb:sync
# Or manually copy plans.json + medications.json to data/

# 4. Start database
docker compose -f docker/docker-compose.yml up postgres -d

# 5. Run migrations
npm run db:migrate

# 6. Start development server
npm run dev

# 7. Verify
curl http://localhost:3000/health
```

## Docker Deployment

```bash
# Build and start everything
docker compose -f docker/docker-compose.yml up --build

# Verify
curl http://localhost:3000/health
# Expected: {"status":"ok","service":"neuro-scribe","version":"0.1.0"}
```

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `PORT` | No | Server port (default: 3000) |
| `NODE_ENV` | No | `development`, `staging`, or `production` |
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `ANTHROPIC_API_KEY` | Yes | Claude API key (BAA required for PHI) |
| `DEEPGRAM_API_KEY` | Yes* | Deepgram API key (*required for transcription) |
| `JWT_SECRET` | Yes | Secret for JWT verification (64+ chars) |
| `AUTH_ISSUER` | Yes | OAuth 2.0 issuer URL |
| `AUTH_AUDIENCE` | Yes | OAuth 2.0 audience |
| `ENCRYPTION_KEY` | Yes | 64-char hex string for AES-256 encryption |
| `PLANS_JSON_PATH` | No | Path to plans.json (default: `./data/plans.json`) |
| `MEDICATIONS_JSON_PATH` | No | Path to medications.json (default: `./data/medications.json`) |
| `LOG_LEVEL` | No | `info` (default), `warn`, `error`. NEVER use `debug` in production |

### Generating the Encryption Key

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

**Store this securely.** If you lose this key, encrypted PHI in the database becomes unrecoverable.

## Database Setup

### PostgreSQL Configuration

For HIPAA compliance, enable:
- TDE (Transparent Data Encryption) at rest
- SSL connections only (`sslmode=require` in connection string)
- Statement logging disabled (to prevent PHI in database logs)

### Run Migrations

```bash
npm run db:migrate
```

### Backup Strategy

- Daily automated backups with point-in-time recovery
- Backups must be encrypted
- Test restore procedure monthly
- Retain backups per your data retention policy

## Production Checklist

### Pre-Deploy

- [ ] All environment variables set (no defaults)
- [ ] Encryption key generated and securely stored
- [ ] Database SSL enabled
- [ ] BAAs signed with all vendors
- [ ] `npm run test` passes
- [ ] `npm run qa:security` passes (no high/critical vulnerabilities)
- [ ] `NODE_ENV=production` is set
- [ ] `LOG_LEVEL=info` (never `debug` in production)
- [ ] CORS origin restricted to your domain
- [ ] JWT secret is unique to this environment

### Post-Deploy

- [ ] Health check returns 200: `curl https://your-domain/health`
- [ ] Auth flow works end-to-end
- [ ] Knowledge base loaded (check startup logs)
- [ ] Audit log is writing (check first PHI access)
- [ ] No PHI in application logs (spot check)

## AWS Deployment (Production)

### Recommended Architecture

```
Route 53 → CloudFront → ALB → ECS Fargate → RDS PostgreSQL (encrypted)
                                                ↕
                                          Secrets Manager
```

### Services Used

| AWS Service | Purpose | HIPAA Eligible |
|-------------|---------|----------------|
| ECS Fargate | Container runtime | Yes |
| RDS PostgreSQL | Database | Yes |
| Secrets Manager | API keys, encryption key | Yes |
| CloudWatch | Logging + monitoring | Yes |
| CloudTrail | AWS API audit trail | Yes |
| ALB | Load balancing + TLS termination | Yes |
| S3 | Temp audio staging (if needed) | Yes |

### Key Configuration

- Enable AWS CloudTrail for API-level auditing
- RDS: Enable encryption, enforce SSL, disable performance insights (may log queries)
- ECS: Use Fargate (no EC2 to manage), set CPU/memory limits
- Secrets Manager: Store `ENCRYPTION_KEY`, `ANTHROPIC_API_KEY`, `DEEPGRAM_API_KEY`

## Monitoring

### Health Check

```
GET /health → 200 OK
```

### Key Metrics to Monitor

| Metric | Alert Threshold | Action |
|--------|----------------|--------|
| Error rate (5xx) | >1% | Investigate server logs |
| Response latency (p95) | >5s | Scale up or investigate |
| Note generation time | >60s | Check Claude API status |
| Failed auth attempts | >10/min | Possible attack — review |
| Database connections | >80% pool | Scale database |
| Disk usage | >80% | Clean up or expand |

## Troubleshooting

### Common Issues

**"ENCRYPTION_KEY must be a 64-character hex string"**
→ Generate a new key: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`

**"DATABASE_URL environment variable is required"**
→ Set the PostgreSQL connection string in `.env`

**Knowledge service fails to load**
→ Verify `data/plans.json` and `data/medications.json` exist and are valid JSON
→ Run `npm run kb:sync` to re-sync from neuro-plans

**Auth returning 401 for valid users**
→ Verify `JWT_SECRET`, `AUTH_ISSUER`, and `AUTH_AUDIENCE` match your auth provider config
