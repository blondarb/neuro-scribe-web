# Neuro Scribe — Security Architecture

**Audience:** Compliance officers, security team, HIPAA auditors
**Last updated:** 2026-02-11

---

## PHI Data Flow

```
Patient encounter (audio) → [EPHEMERAL, never stored]
  → Transcription API (Deepgram, BAA required)
    → Transcript (encrypted at rest in PostgreSQL)
      → Claude API (note generation, BAA required, zero-retention)
        → Clinical note (encrypted at rest in PostgreSQL)
          → Physician review → Copy to EHR
```

### PHI Touchpoints

| Component | Handles PHI | Protection |
|-----------|-------------|-----------|
| Browser (client) | Audio in memory, transcript, note | HTTPS only; no local persistence; session-scoped |
| API server | Request/response transit | TLS 1.3; no PHI in logs, URLs, or error messages |
| Deepgram | Audio stream | BAA; zero-retention policy; no storage |
| Claude API | Transcript text | BAA; zero-retention policy |
| PostgreSQL | Transcripts, notes | AES-256-GCM (app-level) + TDE (database-level) |
| Knowledge Service | None | Read-only reference data (plans, medications) |
| Audit log | Access metadata only | No PHI content; only user ID, resource ID, timestamp |

## Encryption

### At Rest (AES-256-GCM)

All PHI is encrypted at the application level before database storage:

```
PHI → JSON.stringify() → AES-256-GCM encrypt → BYTEA column
BYTEA column → AES-256-GCM decrypt → JSON.parse() → PHI
```

- **Algorithm:** AES-256-GCM (authenticated encryption)
- **Key management:** Environment variable (move to AWS Secrets Manager for production)
- **IV:** Random 12-byte IV per encryption (prevents pattern analysis)
- **Authentication tag:** 16-byte GCM tag (detects tampering)

### In Transit

- TLS 1.3 for all connections (API, database, external services)
- No PHI in URLs (POST bodies only)
- No PHI in HTTP headers
- WebSocket connections use WSS (TLS)

## Authentication & Authorization

| Mechanism | Implementation |
|-----------|---------------|
| Protocol | OAuth 2.0 / OpenID Connect |
| Tokens | JWT (15-minute access, 7-day refresh, rotation on use) |
| Session timeout | 15 minutes idle |
| Roles | `physician` (full), `admin` (user management), `readonly` (view only) |
| Data isolation | Users can only access their own encounters |

## Audit Logging

Every PHI access generates an immutable audit record:

```json
{
  "timestamp": "2026-02-11T14:30:00.000Z",
  "userId": "550e8400-e29b-41d4-a716-446655440000",
  "action": "encounters.read",
  "resourceType": "encounters",
  "resourceId": "7c9e6679-7425-40de-944b-e07fc1f90ae7",
  "ip": "10.0.1.50"
}
```

**Never included in audit logs:** Patient names, MRNs, transcript text, note content, dates of birth.

## PHI Leak Prevention

### Application Level

1. **PHI-safe logger:** Only allow-listed fields can be logged (see `src/shared/logger.ts`)
2. **Error sanitization:** All error responses use generic messages (see `src/api/middleware/phi-guard.ts`)
3. **No PHI in URLs:** All PHI transmitted via POST request bodies

### CI/CD Level

4. **PHI pattern scanner:** Automated scan of code for PHI patterns in log statements
5. **Dependency audit:** `npm audit` blocks high/critical vulnerabilities

## HIPAA Technical Safeguard Mapping

| HIPAA Requirement | Section | Implementation | Status |
|-------------------|---------|---------------|--------|
| Access Control (§164.312(a)(1)) | Unique user ID | OAuth 2.0 external ID | Implemented |
| | Emergency access | Admin role with enhanced audit | Planned |
| | Automatic logoff | 15-minute session timeout | Implemented |
| | Encryption | AES-256-GCM at rest, TLS 1.3 in transit | Implemented |
| Audit Controls (§164.312(b)) | Audit logging | Every PHI access logged | Implemented |
| Integrity (§164.312(c)(1)) | PHI integrity | GCM authentication tag, DB constraints | Implemented |
| Authentication (§164.312(d)) | Person authentication | OAuth 2.0 / OIDC | Implemented |
| Transmission Security (§164.312(e)(1)) | Encryption in transit | TLS 1.3, no PHI in URLs | Implemented |

## BAA Requirements

| Vendor | Service | PHI Exposure | BAA Required |
|--------|---------|-------------|-------------|
| Anthropic | Claude API | Transcript text → note generation | Yes |
| Deepgram | Nova-2 Medical | Audio stream → transcription | Yes |
| Auth provider | Authentication | Email, user metadata | Yes |
| Cloud hosting | Infrastructure | Encrypted PHI in database | Yes |
| GitHub | Source code | None (no PHI in repo) | No |

**Rule:** System MUST NOT process real patient data until ALL BAAs are signed.

## Incident Response

If a PHI breach is suspected:

1. **Contain:** Disable affected user accounts, rotate encryption key
2. **Assess:** Review audit logs to determine scope of access
3. **Notify:** Follow organizational breach notification procedures
4. **Remediate:** Fix the root cause, update security controls
5. **Document:** Record the incident and response actions

## Security Testing

| Test | Frequency | Method |
|------|-----------|--------|
| PHI leak scan | Every PR | Automated CI check |
| Dependency audit | Every PR | `npm audit` |
| Penetration test | Annually | Third-party assessment |
| Access control review | Quarterly | Manual role/permission audit |
| Encryption verification | Per deployment | Automated test suite |
