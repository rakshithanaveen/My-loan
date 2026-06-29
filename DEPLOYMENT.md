# 🚀 LoanWeb Deployment Guide

## Quick Start

### Local Development

```bash
# 1. Install dependencies
npm install

# 2. Create .env file
cp .env.example .env

# 3. Start development server
npm run dev

# Server runs on http://localhost:5000
# Frontend: Open index.html in browser
```

## Production Deployment

### Option 1: Deploy on Heroku

```bash
# 1. Install Heroku CLI
# https://devcenter.heroku.com/articles/heroku-cli

# 2. Login to Heroku
heroku login

# 3. Create new app
heroku create loanweb-app

# 4. Set environment variables
heroku config:set JWT_SECRET="your-super-secret-key"
heroku config:set NODE_ENV="production"

# 5. Deploy
git push heroku main

# 6. View logs
heroku logs --tail
```

### Option 2: Deploy on AWS EC2

```bash
# 1. Launch EC2 Instance (Ubuntu 20.04)
# 2. SSH into instance
ssh -i your-key.pem ubuntu@your-instance-ip

# 3. Install Node.js
curl -fsSL https://deb.nodesource.com/setup_16.x | sudo -E bash -
sudo apt-get install -y nodejs

# 4. Clone repository
git clone https://github.com/rakshithanaveen/Loanweb.git
cd Loanweb

# 5. Install PM2 (process manager)
sudo npm install -g pm2

# 6. Create .env file
cp .env.example .env
# Edit .env with production values

# 7. Install dependencies
npm install

# 8. Start with PM2
pm2 start server.js --name "loanweb"
pm2 save
pm2 startup

# 9. Install Nginx as reverse proxy
sudo apt-get install nginx

# 10. Configure Nginx
sudo nano /etc/nginx/sites-available/default
# Add proxy configuration pointing to localhost:5000

# 11. Restart Nginx
sudo systemctl restart nginx
```

### Option 3: Docker Deployment

```dockerfile
# Create Dockerfile
FROM node:16-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .

EXPOSE 5000

CMD ["npm", "start"]
```

```bash
# Build and run
docker build -t loanweb .
docker run -p 5000:5000 --env-file .env loanweb
```

### Option 4: Deploy on Railway

```bash
# 1. Push to GitHub
git push origin main

# 2. Go to railway.app
# 3. Connect GitHub repository
# 4. Add environment variables
# 5. Deploy automatically
```

## Database Backup Strategy

### Automated Backups (Cron Job)

```bash
# Create backup script: backup.sh
#!/bin/bash
DATABASE_FILE="./data/loanweb.db"
BACKUP_DIR="./backups"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")

mkdir -p $BACKUP_DIR
cp $DATABASE_FILE $BACKUP_DIR/loanweb_$TIMESTAMP.db

# Keep only last 30 backups
ls -t $BACKUP_DIR/loanweb_*.db | tail -n +31 | xargs rm -f

# Add to crontab (run daily at 2 AM)
# 0 2 * * * /path/to/backup.sh
```

### Cloud Backup

```bash
# Upload to AWS S3
aws s3 cp ./data/loanweb.db s3://your-bucket/backups/loanweb_$(date +%Y%m%d).db

# Or Google Drive backup
# Use https://github.com/astrada/google-drive-ocamlfuse
```

## SSL/HTTPS Setup

### Using Let's Encrypt (Free)

```bash
# 1. Install Certbot
sudo apt-get install certbot python3-certbot-nginx

# 2. Get certificate
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

# 3. Auto-renewal
sudo systemctl enable certbot.timer
```

## Monitoring & Logs

### Application Monitoring

```bash
# Using PM2 Plus (free tier)
pm2 plus

# Or with systemd
sudo journalctl -u loanweb -f
```

### Database Monitoring

```bash
# Check database size
ls -lh ./data/loanweb.db

# Monitor queries (development)
echo ".mode line" | sqlite3 ./data/loanweb.db
```

## Performance Optimization

### Enable Compression

```javascript
import compression from 'compression';
app.use(compression());
```

### Caching Headers

```javascript
app.use((req, res, next) => {
  res.setHeader('Cache-Control', 'public, max-age=3600');
  next();
});
```

### Database Connection Pooling

```javascript
// For better scalability, consider using connection pooling
// Current SQLite is single-file, consider PostgreSQL for production scale
```

## Troubleshooting

### Port Already in Use
```bash
lsof -i :5000  # Find process
kill -9 <PID>  # Kill it
```

### Database Locked
```bash
# SQLite temporary file lock
rm -f ./data/loanweb.db-wal
rm -f ./data/loanweb.db-shm
```

### Memory Issues
```bash
# Increase Node.js memory
node --max-old-space-size=4096 server.js
```

## Scaling Recommendations

### Current Setup (SQLite)
- Good for: Up to 50,000 loans, < 1M records
- Limitations: Single process, no horizontal scaling

### Recommended Upgrade Path

**Small Scale → PostgreSQL + Node Cluster**

```bash
# Install PostgreSQL
sudo apt-get install postgresql postgresql-contrib

# Update connection string in code
POSTGRES_URL="postgresql://user:password@localhost:5432/loanweb"
```

**Medium Scale → Add Redis Caching**

```bash
# Install Redis
sudo apt-get install redis-server

# Use for session management and caching
```

**Large Scale → Microservices**

- Separate Auth Service
- Separate Loan Service
- Separate Payment Service
- Message Queue (RabbitMQ/Kafka)

## Security Checklist

- [ ] Change JWT_SECRET to strong random string
- [ ] Enable HTTPS/SSL
- [ ] Set secure headers (Helmet.js)
- [ ] Rate limiting enabled
- [ ] Input validation on all endpoints
- [ ] SQL injection prevention (parameterized queries)
- [ ] CORS properly configured
- [ ] Environment variables not in git
- [ ] Regular dependency updates
- [ ] Database backups automated
- [ ] Access logs enabled
- [ ] Error logging configured

## Support & Monitoring

- **Uptime Monitoring**: UptimeRobot.com (free)
- **Error Tracking**: Sentry.io (free tier)
- **Performance**: New Relic, DataDog
- **Logs**: LogRocket, Papertrail

---

**Last Updated**: January 2024