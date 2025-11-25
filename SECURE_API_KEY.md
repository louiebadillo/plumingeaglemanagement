# 🚨 URGENT: Secure Your Google Maps API Key

## ⚠️ What Happened

Your Google Maps API key was exposed in `TESTING_GEOFENCING_MAP.md` which was pushed to GitHub. Google Cloud detected this and sent you an alert.

**API Key Exposed**: `AIzaSyDSvlrCzbsqwR3GvgiuNAXlSVJrfJCrHqA`

## ✅ Immediate Actions Required

### Step 1: Revoke/Regenerate the API Key in Google Cloud

1. **Go to Google Cloud Console**:
   - Visit: https://console.cloud.google.com/
   - Navigate to: **APIs & Services** → **Credentials**

2. **Find Your API Key**:
   - Look for the key: `AIzaSyDSvlrCzbsqwR3GvgiuNAXlSVJrfJCrHqA`
   - Click on it to edit

3. **Regenerate the Key** (Recommended):
   - Click **"Regenerate Key"** or **"Delete"** then create a new one
   - This invalidates the old key completely

   **OR**

4. **Restrict the Key** (If you want to keep it):
   - Under **"Application restrictions"**:
     - Select **"HTTP referrers (web sites)"**
     - Add only your domains:
       - `https://your-project.vercel.app/*`
       - `https://*.vercel.app/*` (for preview deployments)
       - `http://localhost:3000/*` (for local development)
   - Under **"API restrictions"**:
     - Select **"Restrict key"**
     - Only enable:
       - Maps JavaScript API
       - Geocoding API
   - Click **"Save"**

### Step 2: Remove the Key from Git History

The key is already in your git history. You need to remove it:

```bash
# Remove the file from git (but keep locally)
git rm --cached TESTING_GEOFENCING_MAP.md

# Commit the removal
git commit -m "security: remove exposed API key from repository"

# Push to GitHub
git push origin main
```

**Note**: The key will still be in git history. If your repo is public, consider:
- Making the repo private, OR
- Using `git filter-branch` or `git filter-repo` to remove it from history (advanced)

### Step 3: Update Your Local .env File

1. **Get your new API key** (from Step 1)
2. **Update your `.env` file**:
   ```env
   REACT_APP_GOOGLE_MAPS_API_KEY=your_new_api_key_here
   ```

### Step 4: Update Vercel Environment Variables

1. Go to your **Vercel project** → **Settings** → **Environment Variables**
2. **Update** `REACT_APP_GOOGLE_MAPS_API_KEY` with your new key
3. Make sure it's set for **Production**, **Preview**, and **Development**

### Step 5: Restrict the New API Key

**IMPORTANT**: Set up restrictions immediately to prevent future issues:

1. **Application Restrictions**:
   - HTTP referrers (web sites)
   - Add:
     - `https://your-project.vercel.app/*`
     - `https://*.vercel.app/*`
     - `http://localhost:3000/*`

2. **API Restrictions**:
   - Restrict key
   - Only enable:
     - Maps JavaScript API
     - Geocoding API

## 🔒 Security Best Practices

### ✅ DO:
- ✅ Store API keys in environment variables only
- ✅ Use `.env` file locally (never commit it)
- ✅ Add API keys to Vercel environment variables
- ✅ Restrict API keys by domain and API
- ✅ Use different keys for development and production
- ✅ Regularly rotate API keys

### ❌ DON'T:
- ❌ Commit API keys to git
- ❌ Put API keys in documentation files
- ❌ Share API keys in screenshots or messages
- ❌ Use unrestricted API keys
- ❌ Leave API keys in code comments

## 📋 Checklist

- [ ] Regenerated/revoked the exposed API key in Google Cloud
- [ ] Removed `TESTING_GEOFENCING_MAP.md` from git
- [ ] Updated local `.env` file with new key
- [ ] Updated Vercel environment variables with new key
- [ ] Set up API key restrictions (domain + API)
- [ ] Tested the application with new key
- [ ] Verified no other files contain API keys

## 🆘 If Your Repo is Public

If your GitHub repository is **public**, the exposed key is visible to everyone. You **MUST**:

1. **Regenerate the key immediately** (Step 1 above)
2. **Consider making the repo private** if it contains sensitive information
3. **Use git filter-repo** to remove the key from history (advanced, requires rewriting history)

## 📝 Files Already Fixed

✅ `TESTING_GEOFENCING_MAP.md` - API key removed, placeholder added
✅ `.gitignore` - Added `TESTING_GEOFENCING_MAP.md` to prevent future commits

## 🔍 Check for Other Exposed Keys

Run this to check for any other exposed keys:
```bash
# Search for Google API keys (starts with AIza)
grep -r "AIza" . --exclude-dir=node_modules --exclude-dir=.git

# Search for any API key patterns
grep -r "api.*key\|API.*KEY" . --exclude-dir=node_modules --exclude-dir=.git
```

---

**Act immediately** - Exposed API keys can be used by anyone and result in unexpected charges!

