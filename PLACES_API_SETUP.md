# Google Places API Setup

## ✅ What You Need to Enable

You've already enabled the **Geocoding API**, but for address autocomplete suggestions, you also need:

### **Places API** (Required for Autocomplete)

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Navigate to **"APIs & Services"** > **"Library"**
3. Search for **"Places API"**
4. Click on it and click **"Enable"**

## 📋 Summary of APIs You Need

For full geofencing functionality, enable these APIs:

1. ✅ **Maps JavaScript API** - For displaying maps (already enabled)
2. ✅ **Geocoding API** - For converting addresses to coordinates (already enabled)
3. ⚠️ **Places API** - For address autocomplete suggestions (needs to be enabled)

## 💰 Pricing

- **Places API Autocomplete**: $2.83 per 1,000 requests (after free tier)
- **Free tier**: Included in your $200/month credit
- Typical usage: Very low cost for facility management (only admins use it)

## 🎯 What This Enables

Once Places API is enabled, when typing a facility address:
- ✅ You'll see address suggestions as you type
- ✅ Suggestions include street addresses, cities, landmarks
- ✅ Selecting a suggestion automatically sets coordinates
- ✅ More accurate than manual typing

## 🔧 Current Implementation

The app now:
1. **Uses Places Autocomplete** for address suggestions (requires Places API)
2. **Falls back to manual geocoding** if autocomplete isn't available
3. **Uses Google Geocoding API** for better accuracy (if API key available)
4. **Falls back to OpenStreetMap** if Google API isn't available

## ✅ Next Steps

1. **Enable Places API** in Google Cloud Console
2. **Restart your development server**
3. **Test the autocomplete** in Facility Management
4. **Update API key restrictions** to include Places API

## 🧪 Testing

After enabling Places API:

1. Go to Facility Management
2. Click "Edit" on a facility
3. Start typing in "Geofencing Address" field
4. You should see address suggestions appear
5. Click a suggestion to automatically set coordinates

That's it! The autocomplete will work automatically once Places API is enabled.

