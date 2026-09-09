import { Router } from "express";
import { passportAuthenticateJwt } from "../config/passport.config";
import {
  checkIntegrationController,
  connectAppController,
  dissconnectAppController,
  getUserIntegrationsController,
  googleOAuthCallbackController,
  microfostOauthCallbackController
} from "../controllers/integration.controller";

const integrationRoutes = Router();

integrationRoutes.get(
  "/all",
  passportAuthenticateJwt,
  getUserIntegrationsController
);

integrationRoutes.get(
  "/check/:appType",
  passportAuthenticateJwt,
  checkIntegrationController
);

integrationRoutes.get(
  "/connect/:appType",
  passportAuthenticateJwt,
  connectAppController
);

integrationRoutes.delete(
  "/dissconnect/:provider",
  passportAuthenticateJwt,
  dissconnectAppController
);

integrationRoutes.get("/google/callback", googleOAuthCallbackController);

integrationRoutes.get("/microsoft/callback", microfostOauthCallbackController);

export default integrationRoutes;
