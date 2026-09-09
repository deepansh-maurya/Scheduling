import { ConfidentialClientApplication } from "@azure/msal-node";
import { google } from "googleapis";
import { config } from "./app.config";

//Google oauth
export const googleOAuth2Client = new google.auth.OAuth2(
  config.GOOGLE_CLIENT_ID,
  config.GOOGLE_CLIENT_SECRET,
  config.GOOGLE_REDIRECT_URI
);

//Zoom oauth


// microsoft oauth


export const microsoftClient = new ConfidentialClientApplication({
  auth: {
    clientId: process.env.MICROSOFT_CLIENT_ID!,
    clientSecret: process.env.MICROSOFT_CLIENT_SECRET!,
    authority: `https://login.microsoftonline.com/${process.env.MICROSOFT_TENANT_ID}`
  }
});
