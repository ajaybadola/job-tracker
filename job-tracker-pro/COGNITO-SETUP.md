# 🔐 AWS Cognito Setup Guide

## 🚨 Current Issue: `redirect_mismatch`

The redirect URI sent to Cognito doesn't match what's configured in your App Client settings.

---

## ✅ **FIXES APPLIED:**

### 1. **Frontend Code Updated**
Both `App.jsx` and `main.jsx` now use:
```javascript
redirect_uri: import.meta.env.VITE_COGNITO_REDIRECT_URI || "http://localhost:5173"
```

### 2. **Vercel Environment Variables**
Added to `vercel.json`:
```json
"VITE_COGNITO_REDIRECT_URI": "https://job-tracker-virid-theta.vercel.app"
```

---

## 🔧 **AWS Cognito Console Actions Required:**

### Go to: AWS Console → Cognito → User Pool → App Integration → App Client Settings

#### **Allowed Callback URLs:**
Add both URLs (EXACT match required):
- ✅ `http://localhost:5173` (development)
- ✅ `https://job-tracker-virid-theta.vercel.app` (production)

#### **Allowed Sign-Out URLs:**
Add both URLs (EXACT match required):
- ✅ `http://localhost:5173` (development)  
- ✅ `https://job-tracker-virid-theta.vercel.app` (production)

#### **OAuth 2.0 Settings:**
- ✅ **Implicit grant**: UNCHECKED
- ✅ **Authorization code grant**: CHECKED
- ✅ **Client credentials**: UNCHECKED

---

## 🌐 **Deployment URLs:**

### **Frontend**: `https://job-tracker-virid-theta.vercel.app`
### **Backend**: `https://job-tracker-db6g.onrender.com`

---

## 🧪 **Testing Steps:**

### 1. **Development Test:**
```bash
# Start frontend with production redirect URI
VITE_COGNITO_REDIRECT_URI=https://job-tracker-virid-theta.vercel.app npm run dev
```

### 2. **Production Test:**
1. Visit: `https://job-tracker-virid-theta.vercel.app`
2. Click "Login"
3. Should redirect to Cognito login page
4. After login, should redirect back to your app

### 3. **Debug Redirect Mismatch:**
If still getting `redirect_mismatch`:
1. Open browser DevTools → Network tab
2. Check the `redirect_uri` parameter in the auth request
3. Compare with Cognito Console settings
4. Ensure EXACT match (no trailing slashes, same protocol)

---

## 🔍 **Common Issues:**

### **Trailing Slash Issue:**
- ❌ `https://job-tracker-virid-theta.vercel.app/`
- ✅ `https://job-tracker-virid-theta.vercel.app`

### **Protocol Mismatch:**
- ❌ `http://job-tracker-virid-theta.vercel.app`
- ✅ `https://job-tracker-virid-theta.vercel.app`

### **Case Sensitivity:**
- URLs must match EXACTLY (case-sensitive)

---

## 🔄 **After Cognito Updates:**

1. **Save changes** in AWS Cognito Console
2. **Redeploy frontend** (Vercel will auto-deploy)
3. **Clear browser cache** (Ctrl+Shift+R)
4. **Test authentication flow**

---

## 📱 **Expected Flow:**

1. **User clicks "Login"** → Redirects to Cognito
2. **User enters credentials** → Cognito validates
3. **Cognito redirects back** → With authorization code
4. **Frontend processes code** → Exchanges for tokens
5. **User is authenticated** → Dashboard loads

---

## 🎯 **Success Checklist:**

- [ ] Cognito App Client updated with correct URLs
- [ ] Vercel environment variables set
- [ ] Frontend code deployed with fixes
- [ ] Browser cache cleared
- [ ] Authentication flow tested
- [ ] No redirect_mismatch errors

**Your authentication should work perfectly after these steps! 🔐**
