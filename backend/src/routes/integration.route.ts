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

integrationRoutes.get("/all", httpAuthenticate, getUserIntegrationsController);

integrationRoutes.get(
  "/check/:appType",
  httpAuthenticate,
  checkIntegrationController
);

integrationRoutes.get(
  "/connect/:appType",
  httpAuthenticate,
  connectAppController
);

integrationRoutes.delete(
  "/dissconnect/:provider",
  httpAuthenticate,
  dissconnectAppController
);

integrationRoutes.get("/zoom/connect", httpAuthenticate, zoomOAuthController);

integrationRoutes.get("/google/callback", googleOAuthCallbackController);

integrationRoutes.get("/microsoft/callback", microfostOauthCallbackController);

integrationRoutes.get("/zoom/callback", zoomOAuthCallbackController);

export default integrationRoutes;
