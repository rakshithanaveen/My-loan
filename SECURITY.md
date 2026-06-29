# 🔒 LoanWeb Security Guide

## Security Features Implemented

### 1. Authentication & Authorization

**Password Security**
- Bcrypt hashing with 10 salt rounds
- Passwords never stored in plain text
- Password validation on registration

```javascript
const hashedPassword = await bcrypt.hash(password, 10);
const isValid = await bcrypt.compare(inputPassword, hashedPassword);
```

**JWT Tokens**
- HS256 algorithm (HMAC-SHA256)
- 7-day expiration
- Stored in localStorage (frontend)
- Validated on every protected endpoint

```javascript
const token = jwt.sign(
  { id, email, username },
  process.env.JWT_SECRET,
  { expiresIn: '7d' }
);
```

### 2. Data Validation

**Input Validation**
- All fields required and validated
- Email format validation
- Number range validation
- String length limits

```javascript
if (!email || !email.includes('@')) {
  return res.status(400).json({ error: 'Invalid email' });
}
```

**Output Validation**
- Never expose sensitive data
- Sanitize error messages
- Don't leak internal errors to clients

### 3. Database Security

**Parameterized Queries**
- Prevents SQL injection
- Uses prepared statements
- Parameters bound separately

```javascript
// SAFE - parameterized
dbRun('SELECT * FROM users WHERE email = ?', [email]);

// UNSAFE - string concatenation (DON'T USE)
dbRun(`SELECT * FROM users WHERE email = '${email}'`);
```

**Soft Deletes**
- Records marked as deleted, not removed
- Audit trail preserved
- Recovery possible if needed

### 4. Access Control

**User Isolation**
- Users can only access their own data
- User ID verified on every operation

```javascript
const loan = await dbGet(
  'SELECT * FROM loans WHERE id = ? AND user_id = ?',
  [loanId, req.user.id]  // Verify ownership
);
```

**Role-Based Access Control (Ready for Expansion)**
```javascript
// Future: admin, manager, viewer roles
const userRole = req.user.role;
if (userRole !== 'admin') {
  return res.status(403).json({ error: 'Forbidden' });
}
```

## Security Best Practices

### Environment Variables

**Never commit secrets to Git**
```bash
# ✓ GOOD - Use .env
JWT_SECRET=super-secret-key-here
DATABASE_PATH=./data/loanweb.db

# ✗ BAD - Hardcoding
const SECRET = 'super-secret-key-here';  // DON'T DO THIS
```

**Example .env for Production**
```bash
NODE_ENV=production
PORT=443
JWT_SECRET=generate-long-random-string-here
JWT_EXPIRE=7d
DATABASE_PATH=/var/lib/loanweb/loanweb.db
CORS_ORIGIN=https://yourdomain.com
LOG_LEVEL=info
```

### HTTPS/SSL

**Enable in Production**
```javascript
const https = require('https');
const fs = require('fs');

const options = {
  key: fs.readFileSync('private-key.pem'),
  cert: fs.readFileSync('certificate.pem')
};

https.createServer(options, app).listen(443);
```

**Use Let's Encrypt for Free**
```bash
sudo certbot certonly --standalone -d yourdomain.com
```

### CORS Configuration

**Restrict to Known Origins**
```javascript
const cors = require('cors');

app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true,
  optionsSuccessStatus: 200
}));
```

### Rate Limiting

**Prevent Brute Force Attacks**
```javascript
const rateLimit = require('express-rate-limit');

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,  // 15 minutes
  max: 100  // limit each IP to 100 requests per windowMs
});

app.use('/api/', limiter);

// Stricter limit for auth
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5  // 5 attempts per 15 minutes
});

app.post('/api/auth/login', authLimiter, authController.login);
```

### Security Headers

**Add Protective Headers**
```javascript
const helmet = require('helmet');
app.use(helmet());

// This adds:
// - Content-Security-Policy
// - X-Frame-Options
// - X-Content-Type-Options
// - Strict-Transport-Security
// - X-XSS-Protection
```

### Error Handling

**Don't Leak Information**
```javascript
// ✓ GOOD - Generic message
res.status(500).json({ error: 'An error occurred' });

// ✗ BAD - Exposes internals
res.status(500).json({ 
  error: error.message,
  stack: error.stack  // Never expose!
});
```

## Audit Trail

**Track All Changes**
```javascript
async function logAudit(userId, action, entityType, entityId, changes) {
  await dbRun(
    `INSERT INTO audit_logs (id, user_id, action, entity_type, entity_id, changes, ip_address)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [uuidv4(), userId, action, entityType, entityId, JSON.stringify(changes), req.ip]
  );
}

// Usage
await logAudit(userId, 'CREATE', 'Loan', loanId, { amount: 10000 });
await logAudit(userId, 'UPDATE', 'Loan', loanId, { status: 'closed' });
await logAudit(userId, 'DELETE', 'Loan', loanId, { borrower: 'John Doe' });
```

## Dependency Security

**Keep Dependencies Updated**
```bash
# Check for vulnerabilities
npm audit

# Fix vulnerabilities
npm audit fix

# Update packages
npm update

# Check outdated packages
npm outdated
```

**Lock Versions**
```json
{
  "dependencies": {
    "express": "4.18.2",
    "bcryptjs": "2.4.3",
    "jsonwebtoken": "9.0.2"
  },
  "engines": {
    "node": ">=16.0.0"
  }
}
```

## Testing Security

### OWASP Top 10 Mitigation

| Risk | Mitigation | Status |
|------|-----------|--------|
| Injection | Parameterized queries | ✓ |
| Broken Auth | JWT + bcrypt | ✓ |
| XSS | Input sanitization | ✓ |
| CSRF | Same-origin policy | ✓ |
| Weak Crypto | bcrypt 10 rounds | ✓ |
| Data Exposure | HTTPS + no logs | ✓ |
| Broken Access | User ID verification | ✓ |
| XXE | JSON parser (safe) | ✓ |
| Insecure Deserialize | Don't use eval | ✓ |
| Insufficient Logging | Audit trails | ✓ |

### Security Testing

```bash
# Test for known vulnerabilities
npm audit

# Test API endpoints
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"test"}'

# Test SQL injection prevention
# Try: email: "' OR '1'='1
# Should fail gracefully

# Test XSS prevention
# Try: name: "<script>alert('xss')</script>"
# Should be escaped or rejected
```

## Incident Response

### If Breached

1. **Immediate Actions**
   - Take application offline
   - Rotate all secrets (JWT_SECRET, database key)
   - Review audit logs
   - Identify compromised data

2. **Investigation**
   - Check auth logs for unauthorized access
   - Review modified records
   - Identify attack vectors
   - Check server logs

3. **Recovery**
   - Restore from clean backup
   - Deploy patched code
   - Notify affected users
   - Monitor closely

4. **Prevention**
   - Update security patches
   - Review code for vulnerabilities
   - Implement additional monitoring
   - Consider penetration testing

## Security Checklist

- [ ] JWT_SECRET is strong (32+ characters)
- [ ] No secrets in .env.example
- [ ] No secrets in git history
- [ ] HTTPS enabled in production
- [ ] CORS configured for specific origins
- [ ] Rate limiting enabled
- [ ] Input validation on all endpoints
- [ ] Parameterized queries used
- [ ] User ownership verified on all operations
- [ ] Passwords hashed with bcrypt
- [ ] Error messages don't leak info
- [ ] Security headers set
- [ ] Dependencies up to date
- [ ] Audit logs enabled
- [ ] Backup strategy implemented
- [ ] Monitoring and alerting enabled
- [ ] Regular security reviews scheduled

---

**Security Policy**: Version 1.0
**Last Updated**: January 2024