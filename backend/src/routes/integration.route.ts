import { Router } from "express";
import { httpAuthenticate } from "../config/auth.config";
import {
  checkIntegrationController,
  connectAppController,
  dissconnectAppController,
  getUserIntegrationsController,
  googleOAuthCallbackController,
  microfostOauthCallbackController,
  zoomOAuthCallbackController,
  zoomOAuthController
} from "../controllers/integration.controller";

const integrationRoutes = Router();

integrationRoutes.use(httpAuthenticate);

integrationRoutes.get("/all", getUserIntegrationsController);

integrationRoutes.get("/check/:appType", checkIntegrationController);

integrationRoutes.get("/connect/:appType", connectAppController);

integrationRoutes.delete("/dissconnect/:provider", dissconnectAppController);

integrationRoutes.get("/zoom/connect", zoomOAuthController);
integrationRoutes.get("/google/callback", googleOAuthCallbackController);

integrationRoutes.get("/microsoft/callback", microfostOauthCallbackController);

integrationRoutes.get("/zoom/callback", zoomOAuthCallbackController);

export default integrationRoutes;
