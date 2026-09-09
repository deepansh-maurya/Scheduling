import { Request, Response } from "express";
import { asyncHandler } from "../middlewares/asyncHandler.middeware";
import { HTTPSTATUS } from "../config/http.config";
import {
  checkIntegrationService,
  connectAppService,
  createIntegrationService,
  dissconencteService,
  getUserIntegrationsService
} from "../services/integration.service";
import { asyncHandlerAndValidation } from "../middlewares/withValidation.middleware";
import { AppTypeDTO, ProviderDTO } from "../database/dto/integration.dto";
import { config } from "../config/app.config";
import { decodeState } from "../utils/helper";
import { googleOAuth2Client, microsoftClient } from "../config/oauth.config";
import {
  IntegrationAppTypeEnum,
  IntegrationCategoryEnum,
  IntegrationProviderEnum
} from "../database/entities/integration.entity";

const CLIENT_APP_URL = config.FRONTEND_INTEGRATION_URL;

export const getUserIntegrationsController = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.user?.id as string;

    const integrations = await getUserIntegrationsService(userId);

    return res.status(HTTPSTATUS.OK).json({
      message: "Fetched user integrations successfully",
      integrations
    });
  }
);

export const checkIntegrationController = asyncHandlerAndValidation(
  AppTypeDTO,
  "params",
  async (req: Request, res: Response, appTypeDto) => {
    const userId = req.user?.id as string;

    const isConnected = await checkIntegrationService(
      userId,
      appTypeDto.appType
    );

    return res.status(HTTPSTATUS.OK).json({
      message: "Integration checked successfully",
      isConnected
    });
  }
);

export const connectAppController = asyncHandlerAndValidation(
  AppTypeDTO,
  "params",
  async (req: Request, res: Response, appTypeDto) => {
    const userId = req.user?.id as string;

    const { url } = await connectAppService(userId, appTypeDto.appType);

    return res.status(HTTPSTATUS.OK).json({
      url
    });
  }
);

export const dissconnectAppController = asyncHandlerAndValidation(
  ProviderDTO,
  "params",
  async (req: Request, res: Response, appTypeDto) => {
    const userId = req.user?.id as string;

    await dissconencteService(userId, appTypeDto.provider);

    return res.status(HTTPSTATUS.OK).json({
      message: `${appTypeDto.provider} dissconencted successfully`
    });
  }
);

export const googleOAuthCallbackController = asyncHandler(
  async (req: Request, res: Response) => {
    const { code, state } = req.query;

    const CLIENT_URL = `${CLIENT_APP_URL}?app_type=google`;

    if (!code || typeof code !== "string") {
      return res.redirect(`${CLIENT_URL}&error=Invalid authorization`);
    }

    if (!state || typeof state !== "string") {
      return res.redirect(`${CLIENT_URL}&error=Invalid state parameter`);
    }

    const { userId } = decodeState(state);

    if (!userId) {
      return res.redirect(`${CLIENT_URL}&error=UserId is required`);
    }

    const { tokens } = await googleOAuth2Client.getToken(code);

    if (!tokens.access_token) {
      return res.redirect(`${CLIENT_URL}&error=Access Token not passed`);
    }

    await createIntegrationService({
      userId: userId,
      provider: IntegrationProviderEnum.GOOGLE,
      category: IntegrationCategoryEnum.CALENDAR_AND_VIDEO_CONFERENCING,
      app_type: IntegrationAppTypeEnum.GOOGLE_MEET_AND_CALENDAR,
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token || undefined,
      expiry_date: tokens.expiry_date || null,
      metadata: {
        scope: tokens.scope,
        token_type: tokens.token_type
      }
    });

    return res.redirect(`${CLIENT_URL}&success=true`);
  }
);

export const microfostOauthCallbackController = asyncHandler(
  async (req: Request, res: Response) => {
    const { code, state } = req.query;

    console.log(code, state);

    const CLIENT_URL = `${CLIENT_APP_URL}?app_type=microsoft`;

    // Validate authorization code
    if (!code || typeof code !== "string") {
      return res.redirect(`${CLIENT_URL}&error=Invalid authorization`);
    }

    // Validate state
    if (!state || typeof state !== "string") {
      return res.redirect(`${CLIENT_URL}&error=Invalid state parameter`);
    }

    // Get Meetly user ID from OAuth state
    const { userId } = decodeState(state);

    if (!userId) {
      return res.redirect(`${CLIENT_URL}&error=UserId is required`);
    }

    try {
      const tokenResponse = await microsoftClient.acquireTokenByCode({
        code,

        scopes: [
          "openid",
          "profile",
          "email",
          "offline_access",
          "User.Read",
          "Calendars.ReadWrite"
        ],

        redirectUri: process.env.MICROSOFT_REDIRECT_URI!
      });

      console.log(tokenResponse);

      if (!tokenResponse?.accessToken) {
        return res.redirect(`${CLIENT_URL}&error=Access Token not received`);
      }

      await createIntegrationService({
        userId,
        provider: IntegrationProviderEnum.MICROSOFT,
        category: IntegrationCategoryEnum.CALENDAR_AND_VIDEO_CONFERENCING,
        app_type: IntegrationAppTypeEnum.MICROSOFT_TEAMS_AND_OUTLOOK,
        access_token: tokenResponse.accessToken,
        refresh_token: undefined,
        expiry_date: tokenResponse.expiresOn
          ? tokenResponse.expiresOn.getTime()
          : null,
        metadata: {
          scope: tokenResponse.scopes?.join(" ") || "",
          token_type: "Bearer",
          homeAccountId: tokenResponse.account?.homeAccountId,
          username: tokenResponse.account?.username
        }
      });

      return res.redirect(`${CLIENT_URL}&success=true`);
    } catch (error) {
      console.error("Microsoft OAuth callback error:", error);

      return res.redirect(
        `${CLIENT_URL}&error=Failed to connect Microsoft account`
      );
    }
  }
);
