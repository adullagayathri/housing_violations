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

    console.log("🔥 REQUEST RECEIVED");

    if (!payload?.image_id || !payload?.annotations) {
      return res.status(400).json({ error: "Invalid payload" });
    }

    if (!accessToken || !instanceUrl) {
      return res.status(500).json({ error: "Salesforce not ready" });
    }

    // =========================
    // 1. CREATE RECORD
    // =========================
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

    const recordId = recordRes.data.id;
    console.log("✅ Record:", recordId);

    let contentDocumentId = null;

    // =========================
    // 2. UPLOAD IMAGE
    // =========================
    if (payload.image_base64) {
      const base64Data = payload.image_base64.includes(",")
        ? payload.image_base64.split(",")[1]
        : payload.image_base64;

      const fileRes = await axios.post(
        `${instanceUrl}/services/data/v58.0/sobjects/ContentVersion/`,
        {
          Title: payload.image_id,
          PathOnClient: `${payload.image_id}.png`,
          VersionData: Buffer.from(base64Data, "base64"),
        },
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
        }
      );

      const contentVersionId = fileRes.data.id;

      // =========================
      // 3. GET DOCUMENT ID
      // =========================
      const queryRes = await axios.get(
        `${instanceUrl}/services/data/v58.0/query/?q=SELECT+ContentDocumentId+FROM+ContentVersion+WHERE+Id='${contentVersionId}'`,
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      );

      if (!queryRes.data.records?.length) {
        throw new Error("ContentDocumentId not found");
      }

      contentDocumentId = queryRes.data.records[0].ContentDocumentId;

      // =========================
      // 4. LINK TO RECORD
      // =========================
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

      console.log("✅ File linked");
    }

    return res.json({
      success: true,
      recordId,
      contentDocumentId,
    });
  } catch (err) {
    console.error("❌ FULL ERROR:");
    console.error(err.response?.data || err.message);

    return res.status(500).json({
      success: false,
      error: err.response?.data || err.message,
      debug: err.toString(),
    });
  }
});

// =========================
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on ${PORT}`));
