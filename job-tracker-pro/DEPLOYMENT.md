# 🚀 Job Tracker Deployment Guide

## 📋 Overview
Deploy your Job Tracker application to **Render (Backend)** and **Vercel (Frontend)**.

---

## 🔧 Backend Deployment (Render)

### 1. Prepare Backend
```bash
cd backend
npm install
```

### 2. Set Environment Variables in Render
Go to your Render service dashboard → Environment and add:
- `NODE_ENV`: `production`
- `AWS_ACCESS_KEY_ID`: Your AWS Access Key
- `AWS_SECRET_ACCESS_KEY`: Your AWS Secret Key
- `AWS_REGION`: `us-west-1`
- `DYNAMODB_TABLE_NAME`: `JobApplications`

### 3. Deploy to Render
1. Push your code to GitHub
2. Connect your GitHub repo to Render
3. Render will automatically deploy using `render.yaml`
4. Your backend URL will be: `https://your-service-name.onrender.com`

### 4. Test Backend
Visit: `https://your-service-name.onrender.com/`
You should see: `🚀 Job Tracker API is running smoothly...`

---

## 🌐 Frontend Deployment (Vercel)

### 1. Prepare Frontend
```bash
cd frontend
npm install
npm run build
```

### 2. Set Environment Variables in Vercel
Go to your Vercel project → Settings → Environment Variables:
- `VITE_API_URL`: `https://your-backend-url.onrender.com/api/jobs`
- `VITE_COGNITO_REDIRECT_URI`: `https://your-frontend-url.vercel.app`

### 3. Deploy to Vercel
1. Push your code to GitHub
2. Connect your GitHub repo to Vercel
3. Vercel will automatically deploy using `vercel.json`
4. Your frontend URL will be: `https://your-project-name.vercel.app`

---

## 🔐 AWS Cognito Configuration

### Update Cognito App Client
1. Go to AWS Cognito → User Pool → App Integration → App Client Settings
2. Add your production URL to **Callback URLs**:
   - `http://localhost:5173` (for development)
   - `https://your-frontend-url.vercel.app` (for production)
3. Add the same URLs to **Sign-out URLs**
4. Save changes

---

## 📊 DynamoDB Setup

### Create Production Table
```bash
aws dynamodb create-table \
  --table-name JobApplications \
  --attribute-definitions \
    AttributeName=userId,AttributeType=S \
    AttributeName=applicationId,AttributeType=S \
  --key-schema \
    AttributeName=userId,KeyType=HASH \
    AttributeName=applicationId,KeyType=RANGE \
  --billing-mode PAY_PER_REQUEST \
  --region us-west-1
```

---

## 🧪 Testing Production

### 1. Backend Health Check
```bash
curl https://your-backend-url.onrender.com/
```

### 2. API Endpoints
```bash
curl https://your-backend-url.onrender.com/api/jobs/all
```

### 3. Frontend Access
Visit: `https://your-frontend-url.vercel.app`

---

## 🐛 Common Issues

### CORS Issues
- Backend CORS is set to `*` in production
- If issues persist, add your Vercel domain specifically

### Authentication Issues
- Ensure Cognito callback URLs include both localhost and production URLs
- Check that environment variables are set correctly

### Database Issues
- Verify DynamoDB table exists in the correct region
- Check AWS credentials are properly configured

---

## 🔄 CI/CD Pipeline

Both platforms automatically deploy when you push to GitHub:
- **Render**: Deploys backend on every push to main branch
- **Vercel**: Deploys frontend on every push to main branch

---

## 📱 Monitoring

### Render
- Built-in metrics and logs
- Health checks automatically configured
- Error tracking in dashboard

### Vercel
- Real-time logs
- Performance metrics
- Build status tracking

---

## 🎯 Success Checklist

- [ ] Backend deployed to Render
- [ ] Frontend deployed to Vercel  
- [ ] Cognito configured for production URLs
- [ ] DynamoDB table created
- [ ] Environment variables set
- [ ] Authentication working
- [ ] API endpoints responding
- [ ] Job CRUD operations working

Your Job Tracker is now live! 🚀
