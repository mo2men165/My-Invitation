# Vercel Deployment Checklist

## Required Environment Variables

Add these in Vercel Dashboard → Settings → Environment Variables:

### Database
- `MONGODB_URI` - Your MongoDB connection string
- `REDIS_URL` - Your Redis connection URL

### Authentication
- `JWT_SECRET` - Your JWT secret key
- `JWT_REFRESH_SECRET` - Your refresh token secret
- `JWT_EXPIRY` - Default: "1h"
- `JWT_REFRESH_EXPIRY` - Default: "7d"
- `JWT_ISSUER` - Default: "my-invitation-app"
- `JWT_AUDIENCE` - Default: "my-invitation-users"

### Email (MailerSend)
- `MAILERSEND_API_KEY` - Your MailerSend API key
- `MAILERSEND_FROM_EMAIL` - Sender email address
- `MAILERSEND_FROM_NAME` - Sender name

### Cloud Storage (Cloudinary)
- `CLOUDINARY_CLOUD_NAME` - Your Cloudinary cloud name
- `CLOUDINARY_API_KEY` - Your Cloudinary API key
- `CLOUDINARY_API_SECRET` - Your Cloudinary API secret

### Payment (Paymob)
- `PAYMOB_API_KEY` - Your Paymob API key
- `PAYMOB_SECRET_KEY` - Your Paymob secret key
- `PAYMOB_INTEGRATION_ID` - Your integration ID
- `PAYMOB_IFRAME_ID` - Your iframe ID
- `PAYMOB_BASE_URL` - Default: "https://ksa.paymob.com/api"
- `PAYMOB_CURRENCY` - Default: "SAR"

### WhatsApp
- `WHATSAPP_PHONE_NUMBER_ID` - Your WhatsApp Business phone number ID
- `WHATSAPP_ACCESS_TOKEN` - Your WhatsApp access token
- `WHATSAPP_WEBHOOK_VERIFY_TOKEN` - Webhook verification token

### Frontend
- `FRONTEND_URL` - Your frontend URL (e.g., https://myapp.vercel.app)

### Cron Security
- `CRON_SECRET` - Generate with: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`

### System
- `NODE_ENV` - Set to: "production"
- `LOG_LEVEL` - Default: "info"

## Pre-Deployment Steps

1. ✅ Connection caching implemented
2. ✅ Singleton patterns removed
3. ✅ Cron jobs converted to Vercel cron
4. ✅ WhatsApp background jobs implemented
5. ✅ Server.ts conditionally starts

## Deployment Commands

```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy (preview)
vercel

# Deploy (production)
vercel --prod
```

## Post-Deployment Testing

1. Test basic endpoint: `GET /api/auth/public`
2. Test login: `POST /api/auth/login`
3. Test event creation (requires auth)
4. Trigger bulk WhatsApp (small test - 2-3 guests)
5. Check Vercel logs for cron execution (after 2 AM)
6. Monitor function duration in Vercel dashboard

## Rollback Plan

If deployment fails:
1. Keep Render running as backup
2. Test on Vercel preview deployment first
3. Only switch DNS after full testing
4. Keep Render active for 1 week as backup
