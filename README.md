# 💰 LoanWeb - Professional Loan Management Application

## Overview
LoanWeb is a comprehensive loan and lending management web application designed for professionals and finance managers to track loans, manage payments, and maintain detailed financial records with persistent data storage.

## Features

### ✅ Core Functionality
- **User Authentication** - Secure registration and login with JWT tokens
- **Loan Management** - Create, read, update, and delete loans with full tracking
- **Payment Tracking** - Record and manage monthly loan payments
- **Data Persistence** - All data stored securely in SQLite database
- **Soft Deletes** - Deleted records are marked as deleted, preserving historical data
- **User Dashboard** - Overview of all loans and payments at a glance
- **Statistics & Analytics** - Summary of total loans, collections, and status reports

### 🔒 Security Features
- Password hashing with bcrypt
- JWT-based authentication
- User-specific data isolation
- Audit logging capabilities
- Protected API endpoints

### 📊 Data Management
- SQLite database with optimized schema
- Automatic indexes for performance
- Transaction support
- Data backup ready

## Tech Stack

### Frontend
- HTML5, CSS3, JavaScript
- Responsive design for mobile & desktop
- Modern UI with gradients and animations

### Backend
- **Node.js** - JavaScript runtime
- **Express.js** - Web framework
- **SQLite3** - Lightweight relational database
- **JWT** - Authentication tokens
- **Bcrypt** - Password hashing

## Installation & Setup

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn

### Installation Steps

```bash
# 1. Clone the repository
git clone https://github.com/rakshithanaveen/Loanweb.git
cd Loanweb

# 2. Install dependencies
npm install

# 3. Create environment configuration
cp .env.example .env

# 4. Update .env file with your settings
# NODE_ENV=development
# PORT=5000
# JWT_SECRET=your-secure-secret-key
# DATABASE_PATH=./data/loanweb.db

# 5. Start the server
npm start

# For development with auto-reload
npm run dev
```

## API Documentation

### Authentication Endpoints

#### Register User
```
POST /api/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "username": "username",
  "password": "password",
  "full_name": "Full Name"
}
```

#### Login
```
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password"
}

Response:
{
  "token": "jwt_token_here",
  "user": { ... }
}
```

### Loan Endpoints

#### Create Loan
```
POST /api/loans
Authorization: Bearer {token}
Content-Type: application/json

{
  "borrower_name": "John Doe",
  "principal_amount": 10000,
  "interest_rate": 5,
  "tenure_months": 12,
  "start_date": "2024-01-01",
  "description": "Personal loan"
}
```

#### Get All Loans
```
GET /api/loans
Authorization: Bearer {token}
```

#### Get Loan Details
```
GET /api/loans/{id}
Authorization: Bearer {token}
```

#### Update Loan
```
PUT /api/loans/{id}
Authorization: Bearer {token}
Content-Type: application/json

{
  "borrower_name": "Updated Name",
  "status": "closed"
}
```

#### Delete Loan
```
DELETE /api/loans/{id}
Authorization: Bearer {token}
```

### Payment Endpoints

#### Add Payment
```
POST /api/payments
Authorization: Bearer {token}
Content-Type: application/json

{
  "loan_id": "loan_uuid",
  "amount": 500,
  "payment_date": "2024-01-15",
  "month": "January 2024",
  "notes": "Payment received"
}
```

#### Get Payments for Loan
```
GET /api/payments/loan/{loan_id}
Authorization: Bearer {token}
```

#### Update Payment
```
PUT /api/payments/{id}
Authorization: Bearer {token}
Content-Type: application/json

{
  "status": "paid",
  "amount": 600
}
```

#### Delete Payment
```
DELETE /api/payments/{id}
Authorization: Bearer {token}
```

## Database Schema

### Users Table
```sql
CREATE TABLE users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  username TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  full_name TEXT,
  phone TEXT,
  created_at DATETIME,
  updated_at DATETIME,
  is_deleted INTEGER
)
```

### Loans Table
```sql
CREATE TABLE loans (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  borrower_name TEXT NOT NULL,
  principal_amount REAL NOT NULL,
  interest_rate REAL,
  tenure_months INTEGER NOT NULL,
  start_date DATE,
  end_date DATE,
  status TEXT,
  description TEXT,
  created_at DATETIME,
  updated_at DATETIME,
  is_deleted INTEGER
)
```

### Payments Table
```sql
CREATE TABLE payments (
  id TEXT PRIMARY KEY,
  loan_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  amount REAL NOT NULL,
  payment_date DATE,
  month TEXT,
  status TEXT,
  notes TEXT,
  created_at DATETIME,
  updated_at DATETIME,
  is_deleted INTEGER
)
```

## Data Persistence Strategy

### ✅ Why SQLite?
1. **Lightweight** - No separate server needed
2. **Reliable** - ACID compliance
3. **Fast** - Good performance for small to medium databases
4. **Portable** - Single database file
5. **Scalable** - Can upgrade to PostgreSQL later

### Soft Delete Policy
- **Deleted records are NOT removed** from database
- `is_deleted` flag marks records as deleted
- Historical data is preserved for auditing
- Can be undeleted if needed
- Queries automatically filter deleted records

### Backup & Recovery
- Database file location: `./data/loanweb.db`
- Simple file-based backup
- Can be stored on cloud storage
- Easy restoration by copying database file

## Usage Guide

### For Users
1. Register with email and password
2. Create loan entries with borrower details
3. Record monthly payments
4. Track loan status and generate reports
5. Download loan documents in PDF format

### For Developers
1. API is RESTful and stateless
2. All endpoints require authentication (except /auth routes)
3. Responses are JSON formatted
4. Timestamps are in ISO 8601 format
5. UUIDs used for all record IDs

## Error Handling

All API errors follow this format:
```json
{
  "error": "Error message here",
  "timestamp": "2024-01-15T10:30:00Z"
}
```

Common HTTP Status Codes:
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `404` - Not Found
- `409` - Conflict (duplicate entry)
- `500` - Server Error

## Performance Optimization

### Indexes
- User ID on loans table
- User ID on payments table
- Loan ID on payments table
- Status fields for quick filtering

### Query Optimization
- Soft delete queries filter is_deleted = 0
- Proper foreign key relationships
- Database connection pooling ready

## Security Best Practices

1. **Never commit .env file** - Keep secrets safe
2. **Use HTTPS in production** - Encrypt data in transit
3. **Strong JWT Secret** - Use long random string
4. **Regular Updates** - Keep dependencies updated
5. **Input Validation** - All inputs are validated
6. **SQL Injection Protection** - Using parameterized queries

## Future Enhancements

- [ ] Multi-user collaboration
- [ ] Advanced analytics and reports
- [ ] SMS and email notifications
- [ ] Mobile app version
- [ ] Integration with payment gateways
- [ ] Export to Excel/CSV
- [ ] Advanced filtering and search
- [ ] Recurring payment automation

## Troubleshooting

### Database Connection Error
- Check if `./data` directory exists
- Ensure correct DATABASE_PATH in .env
- Verify file permissions

### Port Already in Use
```bash
# Change PORT in .env or use:
PORT=3001 npm start
```

### Token Expired
- Re-login to get new token
- Token is valid for 7 days by default

## Support & Contributing

For issues, suggestions, or contributions:
1. Open an issue on GitHub
2. Submit a pull request
3. Contact: rakshithanaveen@example.com

## License

This project is licensed under the MIT License - see LICENSE file for details.

## Author

**Rakshitha Naveen**
- GitHub: [@rakshithanaveen](https://github.com/rakshithanaveen)

---

**Last Updated:** January 2024
**Version:** 2.0.0
