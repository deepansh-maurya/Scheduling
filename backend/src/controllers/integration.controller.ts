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
import { decodeState, encodeState } from "../utils/helper";
import { googleOAuth2Client, microsoftClient } from "../config/oauth.config";
import {
  Integration,
  IntegrationAppTypeEnum,
  IntegrationCategoryEnum,
  IntegrationProviderEnum
} from "../database/entities/integration.entity";
import axios from "axios";
import { AppDataSource } from "../config/database.config";

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

      const cacheData = microsoftClient.getTokenCache().serialize();

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
          username: tokenResponse.account?.username,
          cacheData
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

export const zoomOAuthController = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        message: "Unauthorized"
      });
    }

    const state = encodeState({ userId });

    const authUrl =
      `https://zoom.us/oauth/authorize` +
      `?response_type=code` +
      `&client_id=${process.env.ZOOM_CLIENT_ID}` +
      `&redirect_uri=${encodeURIComponent(process.env.ZOOM_REDIRECT_URI!)}` +
      `&state=${encodeURIComponent(state)}`;

    return res.redirect(authUrl);
  }
);

export const zoomOAuthCallbackController = asyncHandler(
  async (req: Request, res: Response) => {
    const { code, state } = req.query;

    const CLIENT_URL = `${CLIENT_APP_URL}?app_type=zoom`;

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

    try {
      const clientId = process.env.ZOOM_CLIENT_ID!;
      const clientSecret = process.env.ZOOM_CLIENT_SECRET!;
      const redirectUri = process.env.ZOOM_REDIRECT_URI!;

      const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString(
        "base64"
      );

      const tokenResponse = await axios.post(
        "https://zoom.us/oauth/token",
        new URLSearchParams({
          grant_type: "authorization_code",
          code,
          redirect_uri: redirectUri
        }).toString(),
        {
          headers: {
            Authorization: `Basic ${credentials}`,
            "Content-Type": "application/x-www-form-urlencoded"
          }
        }
      );

      const {
        access_token,
        refresh_token,
        expires_in,
        scope,
        token_type,
        api_url
      } = tokenResponse.data;

      if (!access_token) {
        return res.redirect(`${CLIENT_URL}&error=Access Token not received`);
      }

      await createIntegrationService({
        userId,
        provider: IntegrationProviderEnum.ZOOM,
        category: IntegrationCategoryEnum.VIDEO_CONFERENCING,
        app_type: IntegrationAppTypeEnum.ZOOM,
        access_token,
        refresh_token,
        expiry_date: expires_in ? Date.now() + expires_in * 1000 : null,
        metadata: {
          scope: scope || "",
          token_type: token_type || "Bearer",
          api_url: api_url || "https://api.zoom.us"
        }
      });

      return res.redirect(`${CLIENT_URL}&success=true`);
    } catch (error: any) {
      console.error(
        "Zoom OAuth callback error:",
        error?.response?.data || error
      );

      return res.redirect(`${CLIENT_URL}&error=Failed to connect Zoom account`);
    }
  }
);
