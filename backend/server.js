require('dotenv').config();
const express = require('express');
const cors = require('cors');
const axios = require('axios');
const qs = require('qs');
const FormData = require('form-data');
const fs = require('fs'); // if you need to handle file uploads

const app = express();
app.use(cors());
app.use(express.json({ limit: "10mb" })); // allow large payloads

// ===== Salesforce Auth Variables =====
let accessToken = null;
let instanceUrl = null;

// ===== Fetch Salesforce Token =====
async function fetchSalesforceToken() {
  if (!process.env.SF_CONSUMER_KEY || !process.env.SF_CONSUMER_SECRET || !process.env.SF_INSTANCE_URL) {
    console.error("❌ Salesforce environment variables missing");
    return;
  }

  const data = qs.stringify({
    grant_type: 'client_credentials',
    client_id: process.env.SF_CONSUMER_KEY,
    client_secret: process.env.SF_CONSUMER_SECRET,
  });

  try {
    const tokenUrl = `${process.env.SF_INSTANCE_URL}/services/oauth2/token`;

    const response = await axios.post(tokenUrl, data, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    });

    accessToken = response.data.access_token;
    instanceUrl = response.data.instance_url;

    console.log('✅ Salesforce token fetched');
  } catch (err) {
    console.error('❌ Error fetching Salesforce token:', err.response?.data || err.message);
  }
}

// Fetch token on startup
fetchSalesforceToken();
// Refresh token every 55 mins
setInterval(fetchSalesforceToken, 55 * 60 * 1000);

// ===== API Endpoint: Save JSON + optional image =====
app.post('/save', async (req, res) => {
  const payload = req.body;

  if (!payload || !payload.image_id || !payload.annotations) {
    return res.status(400).json({ success: false, error: "Invalid payload" });
  }

  if (!accessToken || !instanceUrl) {
    return res.status(500).json({ success: false, error: "Salesforce not authenticated yet" });
  }

  try {
    // 1️⃣ Save JSON to Salesforce object
    const sfUrl = `${instanceUrl}/services/data/v58.0/sobjects/Housing_Data_Image__c/`;

    const salesforcePayload = {
      Name: payload.image_id,
      JSON__c: JSON.stringify(payload.annotations),
      Image_Name__c: payload.image_id,
      Uploaded_At__c: new Date().toISOString(),
    };

    const response = await axios.post(sfUrl, salesforcePayload, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    const recordId = response.data.id;
    console.log("✅ Saved JSON to Salesforce:", recordId);

    // 2️⃣ Optional: upload image to library (if you receive image as Base64)
    if (payload.image_base64 && process.env.SF_LIBRARY_ID) {
      const form = new FormData();
      const imgBuffer = Buffer.from(payload.image_base64, 'base64');
      form.append('VersionData', imgBuffer, payload.image_id);
      form.append('PathOnClient', payload.image_id);
      form.append('LibraryId', process.env.SF_LIBRARY_ID);

      const libraryUrl = `${instanceUrl}/services/data/v58.0/sobjects/ContentVersion/`;
      const imgResponse = await axios.post(libraryUrl, form, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          ...form.getHeaders(),
        },
      });

      console.log("✅ Saved image to Salesforce library:", imgResponse.data.id);
    }

    res.json({ success: true, sfId: recordId });
  } catch (err) {
    console.error("❌ Salesforce Error:", err.response?.data || err.message);
    res.status(500).json({ success: false, error: err.response?.data || err.message });
  }
});

// ===== Start Server =====
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
