const express = require("express");
const app = express();

app.use(express.json());

const VERIFY_TOKEN = process.env.VERIFY_TOKEN;
const PAGE_ACCESS_TOKEN = process.env.PAGE_ACCESS_TOKEN;

app.get("/webhook", (req, res) => {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  if (mode === "subscribe" && token === VERIFY_TOKEN) {
    console.log("Webhook vérifié avec succès");
    return res.status(200).send(challenge);
  } else {
    console.log("Échec de vérification webhook");
    return res.sendStatus(403);
  }
});

app.post("/webhook", async (req, res) => {
  console.log("Webhook reçu :");
  console.log(JSON.stringify(req.body, null, 2));

  const body = req.body;

  if (body.object === "page") {
    for (const entry of body.entry) {
      const webhookEvent = entry.messaging?.[0];

      if (!webhookEvent) continue;

      const senderId = webhookEvent.sender?.id;
      const messageText = webhookEvent.message?.text;

      console.log("Événement Messenger :", webhookEvent);

      if (senderId && messageText) {
        await sendMessengerText(senderId, `Message reçu : ${messageText}`);
      }
    }

    return res.status(200).send("EVENT_RECEIVED");
  } else {
    return res.sendStatus(404);
  }
});

async function sendMessengerText(recipientId, text) {
  try {
    const response = await fetch(
      `https://graph.facebook.com/v25.0/me/messages?access_token=${PAGE_ACCESS_TOKEN}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          recipient: { id: recipientId },
          message: { text }
        })
      }
    );

    const data = await response.json();
    console.log("Réponse API Messenger :", data);
  } catch (error) {
    console.error("Erreur envoi Messenger :", error);
  }
}

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});