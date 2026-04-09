require('dotenv').config();
const express = require('express');
const cors = require('cors');
const axios = require('axios');
const qs = require('qs');

const app = express();
app.use(cors());
app.use(express.json({ limit: "10mb" }));

// =========================
// Salesforce Auth Variables
// =========================
let accessToken = null;
let instanceUrl = null;

// =========================
// Fetch Salesforce Token
// =========================
async function fetchSalesforceToken() {
  if (!process.env.SF_CONSUMER_KEY || !process.env.SF_CONSUMER_SECRET) {
    console.error("❌ Missing SF credentials in env");
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
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
    });

    accessToken = response.data.access_token;
    instanceUrl = response.data.instance_url;

    console.log("✅ Salesforce token fetched");
  } catch (err) {
    console.error("❌ Token error:", err.response?.data || err.message);
  }
}

// Start auth
fetchSalesforceToken();
setInterval(fetchSalesforceToken, 55 * 60 * 1000);

// =========================
// SAVE ENDPOINT
// =========================
app.post('/save', async (req, res) => {
  const payload = req.body;

  if (!payload?.image_id || !payload?.annotations) {
    return res.status(400).json({ success: false, error: "Invalid payload" });
  }

  if (!accessToken || !instanceUrl) {
    return res.status(500).json({ success: false, error: "Salesforce not ready" });
  }

  try {

    // =====================================================
    // 1️⃣ Create Salesforce Record
    // =====================================================
    const recordPayload = {
      Name: payload.image_id,
      JSON__c: JSON.stringify(payload.annotations),
      Image_Name__c: payload.image_id,
      Uploaded_At__c: new Date().toISOString(),

      // optional debug field (NOT required)
      Library_Id_Debug__c: process.env.SF_LIBRARY_ID || null
    };

    const recordRes = await axios.post(
      `${instanceUrl}/services/data/v58.0/sobjects/Housing_Data_Image__c/`,
      recordPayload,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        }
      }
    );

    const recordId = recordRes.data.id;
    console.log("✅ Record created:", recordId);

    let fileId = null;

    // =====================================================
    // 2️⃣ Upload Image as Salesforce File
    // =====================================================
    if (payload.image_base64) {

      const base64Data = payload.image_base64.includes(",")
        ? payload.image_base64.split(",")[1]
        : payload.image_base64;

      const fileRes = await axios.post(
        `${instanceUrl}/services/data/v58.0/sobjects/ContentVersion/`,
        {
          Title: payload.image_id,
          PathOnClient: `${payload.image_id}.png`,
          VersionData: base64Data
        },
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          }
        }
      );

      const contentVersionId = fileRes.data.id;

      // =====================================================
      // 3️⃣ Get ContentDocumentId
      // =====================================================
      const queryRes = await axios.get(
        `${instanceUrl}/services/data/v58.0/query/?q=SELECT+ContentDocumentId+FROM+ContentVersion+WHERE+Id='${contentVersionId}'`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`
          }
        }
      );

      const contentDocumentId =
        queryRes.data.records[0].ContentDocumentId;

      fileId = contentDocumentId;

      // =====================================================
      // 4️⃣ Link File to Record
      // =====================================================
      await axios.post(
        `${instanceUrl}/services/data/v58.0/sobjects/ContentDocumentLink/`,
        {
          ContentDocumentId: contentDocumentId,
          LinkedEntityId: recordId,
          ShareType: "V",
          Visibility: "AllUsers"
        },
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          }
        }
      );

      console.log("✅ Image uploaded + linked");
    }

    // =========================
    // RESPONSE
    // =========================
    res.json({
      success: true,
      recordId,
      fileId
    });

  } catch (err) {
    console.error("❌ Salesforce Error:", err.response?.data || err.message);

    res.status(500).json({
      success: false,
      error: err.response?.data || err.message
    });
  }
});

// =========================
// START SERVER
// =========================
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
