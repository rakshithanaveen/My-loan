# 🏗️ LoanWeb Architecture

## System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     User Browser                             │
│  (HTML5 / CSS3 / JavaScript - Responsive UI)               │
└──────────────────────────┬──────────────────────────────────┘
                           │ HTTP/HTTPS
                           │
┌──────────────────────────▼──────────────────────────────────┐
│              Express.js Server (Node.js)                    │
├─────────────────────────────────────────────────────────────┤
│  • Authentication Layer (JWT Tokens)                        │
│  • REST API Endpoints                                       │
│  • Request Validation                                       │
│  • Error Handling                                           │
│  • CORS Middleware                                          │
└──────────────────────────┬─────���────────────────────────────┘
                           │ SQL Queries
                           │
┌──────────────────────────▼──────────────────────────────────┐
│              SQLite Database                                │
├─────────────────────────────────────────────────────────────┤
│  • Users Table                                              │
│  • Loans Table                                              │
│  • Payments Table                                           │
│  • Audit Logs Table                                         │
│  • Optimized Indexes                                        │
└─────────────────────────────────────────────────────────────┘
```

## Data Flow

### User Registration
```
1. User submits form with email, username, password
2. Frontend validates input
3. Frontend sends POST to /api/auth/register
4. Backend validates again
5. Backend hashes password with bcrypt
6. Backend stores user in database
7. Backend generates JWT token
8. Token sent to frontend
9. Frontend stores token in localStorage
10. Frontend redirects to dashboard
```

### Loan Creation
```
1. User fills loan form
2. Frontend validates
3. Frontend sends POST to /api/loans with JWT token
4. Backend verifies JWT token
5. Backend validates input
6. Backend generates loan ID (UUID)
7. Backend calculates end date
8. Backend stores loan in database
9. Frontend receives confirmation
10. Frontend refreshes loan list
```

### Payment Recording
```
1. User adds payment for loan
2. Frontend validates amount and date
3. Frontend sends POST to /api/payments with JWT
4. Backend verifies ownership of loan
5. Backend generates payment ID (UUID)
6. Backend stores payment in database
7. Payment status set to 'paid'
8. Frontend updates payment list
9. UI shows payment with visual confirmation
```

### Data Deletion
```
1. User clicks delete button
2. Frontend shows confirmation dialog
3. User confirms
4. Frontend sends DELETE request
5. Backend verifies ownership
6. Backend sets is_deleted = 1 (soft delete)
7. Backend also soft deletes related payments
8. Frontend removes item from UI
9. Data preserved in database for audit
```

## Database Schema

### Users
```sql
- id (UUID, PRIMARY KEY)
- email (UNIQUE)
- username (UNIQUE)
- password (hashed)
- full_name
- phone
- created_at
- updated_at
- is_deleted
```

### Loans
```sql
- id (UUID, PRIMARY KEY)
- user_id (FOREIGN KEY)
- borrower_name
- principal_amount (REAL)
- interest_rate (REAL)
- tenure_months (INTEGER)
- start_date (DATE)
- end_date (DATE)
- status (active/closed/pending)
- description
- created_at
- updated_at
- is_deleted
```

### Payments
```sql
- id (UUID, PRIMARY KEY)
- loan_id (FOREIGN KEY)
- user_id (FOREIGN KEY)
- amount (REAL)
- payment_date (DATE)
- month (TEXT: "January 2024")
- payment_type (monthly/extra)
- status (paid/pending/overdue)
- notes
- created_at
- updated_at
- is_deleted
```

### Audit Logs
```sql
- id (UUID, PRIMARY KEY)
- user_id (FOREIGN KEY)
- action (CREATE/UPDATE/DELETE)
- entity_type (Loan/Payment/User)
- entity_id
- changes (JSON)
- created_at
- ip_address
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Create account
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user

### Loans
- `POST /api/loans` - Create loan
- `GET /api/loans` - List all loans
- `GET /api/loans/:id` - Get loan details
- `PUT /api/loans/:id` - Update loan
- `DELETE /api/loans/:id` - Delete loan
- `GET /api/loans/stats/summary` - Get statistics

### Payments
- `POST /api/payments` - Record payment
- `GET /api/payments` - List all payments
- `GET /api/payments/loan/:loan_id` - Get loan payments
- `PUT /api/payments/:id` - Update payment
- `DELETE /api/payments/:id` - Delete payment
- `GET /api/payments/stats/summary` - Payment stats

## Security Architecture

### Authentication Flow
```
1. User provides email + password
2. Server hashes password and compares with stored hash
3. If match, server generates JWT token
4. Token contains: user_id, email, username, exp_time
5. Token signed with JWT_SECRET
6. Client stores token in localStorage
7. On each request, token sent in Authorization header
8. Server verifies token signature
9. Server checks token expiration
10. If valid, request proceeds; if not, return 401
```

### Data Protection
- Passwords hashed with bcrypt (10 rounds)
- JWT tokens expire after 7 days
- Soft deletes preserve audit trail
- User can only access their own data
- All inputs validated and sanitized
- Parameterized queries prevent SQL injection

## Performance Optimization

### Database Indexes
- `user_id` indexed on loans table
- `status` indexed on loans table
- `loan_id` indexed on payments table
- `user_id` indexed on payments table
- `user_id` indexed on audit_logs table

### Caching Opportunities
- Cache user stats (5-minute TTL)
- Cache loan summaries (1-hour TTL)
- Cache payment summaries (1-hour TTL)

### Query Optimization
- Avoid N+1 queries
- Use JOINs when fetching related data
- Filter deleted records at query level
- Use LIMIT for pagination

## Scalability Path

### Phase 1: Current (SQLite)
- Single database file
- Good for prototyping
- Up to ~50K loans

### Phase 2: PostgreSQL
- Migrate from SQLite
- Better concurrency
- Up to ~1M loans
- Connection pooling

### Phase 3: Caching Layer
- Add Redis
- Session management
- Query caching

### Phase 4: Microservices
- Separate services
- Message queue
- Horizontal scaling
- Load balancing

## Monitoring & Observability

### Logging
```javascript
// Track: API requests, errors, auth events
app.use(morgan('combined', { stream: fs.createWriteStream('access.log') }));
```

### Error Tracking
```javascript
// Send errors to Sentry or similar
Sentry.captureException(error);
```

### Performance Metrics
```javascript
// Track response times, query performance
const start = Date.now();
// ... operation ...
const duration = Date.now() - start;
```

## Disaster Recovery

### Backup Strategy
- Daily automated backups
- Weekly cloud backups (S3/GCS)
- Monthly retention backups
- Point-in-time recovery capability

### Restoration Procedure
1. Stop application
2. Download backup from cloud
3. Restore database file
4. Verify data integrity
5. Restart application
6. Test critical functions

---

**Architecture Version**: 2.0
**Last Updated**: January 2024