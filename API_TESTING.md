# 🧪 LoanWeb API Testing Guide

## Using cURL

### 1. Register User
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "username": "testuser",
    "password": "securepass123",
    "full_name": "Test User"
  }'
```

### 2. Login
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "securepass123"
  }'

# Response includes token
# Store token in variable:
TOKEN="your_jwt_token_here"
```

### 3. Create Loan
```bash
curl -X POST http://localhost:5000/api/loans \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "borrower_name": "John Doe",
    "principal_amount": 50000,
    "interest_rate": 5,
    "tenure_months": 12,
    "start_date": "2024-01-15",
    "description": "Business loan"
  }'
```

### 4. Get All Loans
```bash
curl -X GET http://localhost:5000/api/loans \
  -H "Authorization: Bearer $TOKEN"
```

### 5. Get Loan Details
```bash
curl -X GET http://localhost:5000/api/loans/{loan_id} \
  -H "Authorization: Bearer $TOKEN"
```

### 6. Add Payment
```bash
curl -X POST http://localhost:5000/api/payments \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "loan_id": "your-loan-id",
    "amount": 5000,
    "payment_date": "2024-01-20",
    "month": "January 2024",
    "notes": "Payment received"
  }'
```

## Using Postman

### Setup
1. Download Postman
2. Import API collection (create new)
3. Create environment with variables:
   - `base_url`: http://localhost:5000
   - `token`: (auto-filled after login)

### Auth Collection

**Register**
```
POST {{base_url}}/api/auth/register
Body (JSON):
{
  "email": "test@example.com",
  "username": "testuser",
  "password": "pass123",
  "full_name": "Test User"
}

Tests:
pm.environment.set("token", pm.response.json().token);
```

**Login**
```
POST {{base_url}}/api/auth/login
Body (JSON):
{
  "email": "test@example.com",
  "password": "pass123"
}

Tests:
pm.environment.set("token", pm.response.json().token);
```

### Loan Collection

**Create Loan**
```
POST {{base_url}}/api/loans
Headers: Authorization: Bearer {{token}}
Body (JSON):
{
  "borrower_name": "Jane Smith",
  "principal_amount": 100000,
  "interest_rate": 7.5,
  "tenure_months": 24,
  "start_date": "2024-01-10",
  "description": "Home renovation"
}
```

**List Loans**
```
GET {{base_url}}/api/loans
Headers: Authorization: Bearer {{token}}
```

**Get Loan Details**
```
GET {{base_url}}/api/loans/{{loan_id}}
Headers: Authorization: Bearer {{token}}
```

**Update Loan**
```
PUT {{base_url}}/api/loans/{{loan_id}}
Headers: Authorization: Bearer {{token}}
Body (JSON):
{
  "status": "closed",
  "description": "Updated description"
}
```

**Delete Loan**
```
DELETE {{base_url}}/api/loans/{{loan_id}}
Headers: Authorization: Bearer {{token}}
```

## Using Thunder Client (VS Code Extension)

1. Install Thunder Client
2. New Request
3. Setup like Postman
4. Quick testing within IDE

## Error Responses

### 400 Bad Request
```json
{
  "error": "Missing required fields"
}
```

### 401 Unauthorized
```json
{
  "error": "Invalid or expired token"
}
```

### 404 Not Found
```json
{
  "error": "Loan not found"
}
```

### 409 Conflict
```json
{
  "error": "Email or username already exists"
}
```

### 500 Server Error
```json
{
  "error": "Internal server error",
  "timestamp": "2024-01-15T10:30:00Z"
}
```

## Test Scenarios

### Scenario 1: Happy Path
1. Register new user ✓
2. Login ✓
3. Create loan ✓
4. Add payments ✓
5. View loan details ✓
6. Update loan ✓

### Scenario 2: Error Handling
1. Login with wrong password → 401 ✓
2. Access loan without token → 401 ✓
3. Access other user's loan → 404 ✓
4. Create loan with missing field → 400 ✓
5. Duplicate email on register → 409 ✓

### Scenario 3: Data Integrity
1. Create multiple loans → Check all listed ✓
2. Add payments to different loans ✓
3. Delete loan → Check payments deleted ✓
4. Verify soft delete (check audit log) ✓

## Performance Testing

### Load Testing with Apache Bench

```bash
# 1000 requests, 10 concurrent
ab -n 1000 -c 10 http://localhost:5000/api/health

# GET request with token
ab -n 1000 -c 10 \
  -H "Authorization: Bearer $TOKEN" \
  http://localhost:5000/api/loans
```

### Load Testing with Artillery

```yaml
# config.yml
config:
  target: 'http://localhost:5000'
  phases:
    - duration: 60
      arrivalRate: 10
scenarios:
  - name: 'Loan API Flow'
    flow:
      - post:
          url: '/api/auth/login'
          json:
            email: 'test@example.com'
            password: 'pass123'
      - get:
          url: '/api/loans'
          headers:
            Authorization: 'Bearer {{ token }}'
```

```bash
artillery run config.yml
```

## Database Testing

### Check Database Contents
```bash
sqlite3 ./data/loanweb.db

# List tables
.tables

# View users
SELECT id, email, username FROM users LIMIT 5;

# View loans with counts
SELECT 
  user_id,
  COUNT(*) as loan_count,
  SUM(principal_amount) as total_lent
FROM loans
WHERE is_deleted = 0
GROUP BY user_id;

# Exit
.quit
```

## Automation Scripts

### Python Test Script

```python
import requests
import json

BASE_URL = 'http://localhost:5000/api'

class LoanWebTester:
    def __init__(self):
        self.token = None
        self.loan_id = None
    
    def register(self):
        response = requests.post(
            f'{BASE_URL}/auth/register',
            json={
                'email': 'test@example.com',
                'username': 'testuser',
                'password': 'pass123',
                'full_name': 'Test User'
            }
        )
        print('Register:', response.status_code)
        return response
    
    def login(self):
        response = requests.post(
            f'{BASE_URL}/auth/login',
            json={
                'email': 'test@example.com',
                'password': 'pass123'
            }
        )
        if response.status_code == 200:
            self.token = response.json()['token']
        print('Login:', response.status_code)
        return response
    
    def create_loan(self):
        headers = {'Authorization': f'Bearer {self.token}'}
        response = requests.post(
            f'{BASE_URL}/loans',
            json={
                'borrower_name': 'Test Borrower',
                'principal_amount': 50000,
                'interest_rate': 5,
                'tenure_months': 12,
                'start_date': '2024-01-15'
            },
            headers=headers
        )
        if response.status_code == 201:
            self.loan_id = response.json()['id']
        print('Create Loan:', response.status_code)
        return response
    
    def run_tests(self):
        self.register()
        self.login()
        self.create_loan()
        print('\nAll tests completed!')

if __name__ == '__main__':
    tester = LoanWebTester()
    tester.run_tests()
```

---

**Testing Guide Version**: 1.0
**Last Updated**: January 2024