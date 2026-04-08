require('dotenv').config();
const express = require('express');
const cors = require('cors');
const axios = require('axios');
const qs = require('qs');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json({ limit: '50mb' })); // allow large payloads for images

// ===== Salesforce Auth Variables =====
let accessToken = null;
let instanceUrl = null;

// ===== Fetch Salesforce Token =====
async function fetchSalesforceToken() {
  const data = qs.stringify({
    grant_type: 'client_credentials',
    client_id: process.env.SF_CONSUMER_KEY,
    client_secret: process.env.SF_CONSUMER_SECRET,
  });

  try {
    const response = await axios.post(
      'https://login.salesforce.com/services/oauth2/token',
      data,
      { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
    );

    accessToken = response.data.access_token;
    instanceUrl = response.data.instance_url;
    console.log('✅ Salesforce token fetched');
  } catch (err) {
    console.error('❌ Error fetching Salesforce token:', err.response?.data || err.message);
  }
}

// Fetch token on startup and refresh every 55 mins
fetchSalesforceToken();
setInterval(fetchSalesforceToken, 55 * 60 * 1000);

// ===== Helper: Upload JSON to Salesforce =====
async function saveJSONToSalesforce(payload) {
  const sfUrl = `${instanceUrl}/services/data/v58.0/sobjects/Violation__c/`; // replace with your object API name
  const salesforcePayload = {
    Name: payload.image_id,
    JSON_Data__c: JSON.stringify(payload.annotations),
    Image_Name__c: payload.image_id,
    Uploaded_At__c: new Date().toISOString().split("T")[0], // YYYY-MM-DD
  };
  const response = await axios.post(sfUrl, salesforcePayload, {
    headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
  });
  return response.data.id;
}

// ===== Helper: Upload Image to Salesforce Library =====
async function uploadImageToLibrary(imageBase64, filename) {
  const url = `${instanceUrl}/services/data/v58.0/sobjects/ContentVersion/`;
  const payload = {
    Title: filename,
    PathOnClient: filename,
    VersionData: imageBase64, // base64 string
    FirstPublishLocationId: process.env.SF_LIBRARY_ID, // library/folder ID
  };

  const response = await axios.post(url, payload, {
    headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
  });

  return response.data.Id;
}

// ===== API Endpoint =====
app.post('/save', async (req, res) => {
  const payload = req.body;

  if (!payload || !payload.image_id || !payload.annotations) {
    return res.status(400).json({ success: false, error: "Invalid payload" });
  }

  try {
    if (!accessToken || !instanceUrl) {
      return res.status(500).json({ success: false, error: "Salesforce not authenticated yet" });
    }

    // 1️⃣ Save JSON
    const sfRecordId = await saveJSONToSalesforce(payload);

    // 2️⃣ Upload annotated image if provided
    let sfImageId = null;
    if (payload.image_base64) {
      sfImageId = await uploadImageToLibrary(payload.image_base64, payload.image_id);
    }

    res.json({ success: true, sfRecordId, sfImageId });
    console.log(`✅ Saved JSON (${sfRecordId})${sfImageId ? ` + Image (${sfImageId})` : ''}`);
  } catch (err) {
    console.error('❌ Salesforce Error:', err.response?.data || err.message);
    res.status(500).json({ success: false, error: err.response?.data || err.message });
  }
});

// ===== Start Server =====
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
