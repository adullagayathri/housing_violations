require("dotenv").config();
const express = require("express");
const cors = require("cors");
const axios = require("axios");
const qs = require("qs");

const app = express();
app.use(cors());
app.use(express.json({ limit: "10mb" }));

// =========================
// AUTH
// =========================
let accessToken = null;
let instanceUrl = null;

async function fetchSalesforceToken() {
  const data = qs.stringify({
    grant_type: "client_credentials",
    client_id: process.env.SF_CONSUMER_KEY,
    client_secret: process.env.SF_CONSUMER_SECRET,
  });

  try {
    const res = await axios.post(
      `${process.env.SF_INSTANCE_URL}/services/oauth2/token`,
      data,
      { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
    );

    accessToken = res.data.access_token;
    instanceUrl = res.data.instance_url;

    console.log("✅ Salesforce connected");
  } catch (err) {
    console.error("❌ Auth error:", err.response?.data || err.message);
  }
}

fetchSalesforceToken();
setInterval(fetchSalesforceToken, 55 * 60 * 1000);

// =========================
// SAVE API
// =========================
app.post("/save", async (req, res) => {
  try {
    const payload = req.body;

    if (!payload?.image_id || !payload?.annotations) {
      return res.status(400).json({ error: "Invalid payload" });
    }

    if (!accessToken || !instanceUrl) {
      return res.status(500).json({ error: "Salesforce not ready" });
    }

    // =========================
    // 1. CHECK EXISTING RECORD
    // =========================
    const query = await axios.get(
      `${instanceUrl}/services/data/v58.0/query/?q=` +
        `SELECT Id FROM Housing_Data_Image__c WHERE Image_Name__c='${payload.image_id}' LIMIT 1`,
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    );

    let recordId = query.data.records?.[0]?.Id;

    // =========================
    // 2. UPSERT RECORD
    // =========================
    if (recordId) {
      // UPDATE existing
      await axios.patch(
        `${instanceUrl}/services/data/v58.0/sobjects/Housing_Data_Image__c/${recordId}`,
        {
          JSON__c: JSON.stringify(payload.annotations),
          Uploaded_At__c: new Date().toISOString(),
        },
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
        }
      );
    } else {
      // CREATE new
      const recordRes = await axios.post(
        `${instanceUrl}/services/data/v58.0/sobjects/Housing_Data_Image__c/`,
        {
          Name: payload.image_id,
          JSON__c: JSON.stringify(payload.annotations),
          Image_Name__c: payload.image_id,
          Uploaded_At__c: new Date().toISOString(),
        },
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
        }
      );

      recordId = recordRes.data.id;
    }

    console.log("✅ Record Ready:", recordId);

    // =========================
    // 3. DELETE OLD FILES (IMPORTANT)
    // =========================
    const oldFiles = await axios.get(
      `${instanceUrl}/services/data/v58.0/query/?q=` +
        `SELECT ContentDocumentId FROM ContentDocumentLink WHERE LinkedEntityId='${recordId}'`,
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    );

    for (const f of oldFiles.data.records || []) {
      await axios.delete(
        `${instanceUrl}/services/data/v58.0/sobjects/ContentDocument/${f.ContentDocumentId}`,
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      );
    }

    // =========================
    // 4. UPLOAD NEW IMAGE
    // =========================
    let contentDocumentId = null;

    if (payload.image_base64) {
      const base64Data = payload.image_base64.includes(",")
        ? payload.image_base64.split(",")[1]
        : payload.image_base64;

      const fileRes = await axios.post(
        `${instanceUrl}/services/data/v58.0/sobjects/ContentVersion/`,
        {
          Title: payload.image_id,
          PathOnClient: `${payload.image_id}.png`,
          VersionData: base64Data,
        },
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
        }
      );

      const contentVersionId = fileRes.data.id;

      const queryRes = await axios.get(
        `${instanceUrl}/services/data/v58.0/query/?q=` +
          `SELECT ContentDocumentId FROM ContentVersion WHERE Id='${contentVersionId}'`,
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      );

      contentDocumentId = queryRes.data.records[0].ContentDocumentId;

      await axios.post(
        `${instanceUrl}/services/data/v58.0/sobjects/ContentDocumentLink/`,
        {
          ContentDocumentId: contentDocumentId,
          LinkedEntityId: recordId,
          ShareType: "V",
          Visibility: "AllUsers",
        },
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
        }
      );
    }

    return res.json({
      success: true,
      recordId,
      contentDocumentId,
    });
  } catch (err) {
    console.error("❌ ERROR:", err.response?.data || err.message);

    return res.status(500).json({
      success: false,
      error: err.response?.data || err.message,
    });
  }
});

// =========================
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on ${PORT}`));
