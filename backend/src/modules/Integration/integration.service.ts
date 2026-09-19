import { ConfidentialClientApplication } from "@azure/msal-node";
import { AppDataSource } from "../../config/database.config";
import {
  googleOAuth2Client,
  microsoftClient,
  msalConfig
} from "../../config/oauth.config";
import {
  Event,
  EventLocationEnumType
} from "../../database/entities/event.entity";
import {
  Integration,
  IntegrationAppTypeEnum,
  IntegrationCategoryEnum,
  IntegrationProviderEnum
} from "../../database/entities/integration.entity";
import { BadRequestException } from "../../utils/app-error";
import { encodeState } from "../../utils/helper";

const appTypeToProviderMap: Record<
  IntegrationAppTypeEnum,
  IntegrationProviderEnum
> = {
  [IntegrationAppTypeEnum.GOOGLE_MEET_AND_CALENDAR]:
    IntegrationProviderEnum.GOOGLE,
  [IntegrationAppTypeEnum.MICROSOFT_TEAMS_AND_OUTLOOK]:
    IntegrationProviderEnum.MICROSOFT,
  [IntegrationAppTypeEnum.ZOOM]: IntegrationProviderEnum.ZOOM
};

const appTypeToCategoryMap: Record<
  IntegrationAppTypeEnum,
  IntegrationCategoryEnum
> = {
  [IntegrationAppTypeEnum.GOOGLE_MEET_AND_CALENDAR]:
    IntegrationCategoryEnum.CALENDAR_AND_VIDEO_CONFERENCING,
  [IntegrationAppTypeEnum.MICROSOFT_TEAMS_AND_OUTLOOK]:
    IntegrationCategoryEnum.CALENDAR_AND_VIDEO_CONFERENCING,
  [IntegrationAppTypeEnum.ZOOM]: IntegrationCategoryEnum.ZOOM
};

const appTypeToTitleMap: Record<IntegrationAppTypeEnum, string> = {
  [IntegrationAppTypeEnum.GOOGLE_MEET_AND_CALENDAR]: "Google Meet & Calendar",
  [IntegrationAppTypeEnum.MICROSOFT_TEAMS_AND_OUTLOOK]:
    "Microsoft Teams & Outlook",
  [IntegrationAppTypeEnum.ZOOM]: IntegrationProviderEnum.ZOOM
};

export const getUserIntegrationsService = async (userId: string) => {
  const integrationRepository = AppDataSource.getRepository(Integration);

  const userIntegrations = await integrationRepository.find({
    where: { user: { id: userId } }
  });

  const connectedMap = new Map(
    userIntegrations.map((integration) => [integration.app_type, true])
  );

  console.log(connectedMap);

  return Object.values(IntegrationAppTypeEnum).flatMap((appType) => {
    return {
      provider: appTypeToProviderMap[appType],
      title: appTypeToTitleMap[appType],
      app_type: appType,
      category: appTypeToCategoryMap[appType],
      isConnected: connectedMap.has(appType) || false
    };
  });
};

export const checkIntegrationService = async (
  userId: string,
  appType: IntegrationAppTypeEnum
) => {
  const integrationRepository = AppDataSource.getRepository(Integration);

  const integration = await integrationRepository.findOne({
    where: { user: { id: userId }, app_type: appType }
  });

  if (!integration) {
    return false;
  }

  return true;
};

export const connectAppService = async (
  userId: string,
  appType: IntegrationAppTypeEnum
) => {
  const state = encodeState({ userId, appType });
  console.log(appType == IntegrationAppTypeEnum.ZOOM);
  let authUrl: string;

  switch (appType) {
    case IntegrationAppTypeEnum.GOOGLE_MEET_AND_CALENDAR:
      authUrl = googleOAuth2Client.generateAuthUrl({
        access_type: "offline",
        scope: ["https://www.googleapis.com/auth/calendar.events"],
        prompt: "consent",
        state
      });
      break;
    case IntegrationAppTypeEnum.MICROSOFT_TEAMS_AND_OUTLOOK:
      authUrl = await microsoftClient.getAuthCodeUrl({
        scopes: [
          "openid",
          "profile",
          "email",
          "offline_access",
          "User.Read",
          "Calendars.ReadWrite"
        ],
        redirectUri: process.env.MICROSOFT_REDIRECT_URI!,
        state
      });
      break;
    case IntegrationAppTypeEnum.ZOOM: {
      authUrl =
        `https://zoom.us/oauth/authorize` +
        `?response_type=code` +
        `&client_id=${process.env.ZOOM_CLIENT_ID}` +
        `&redirect_uri=${encodeURIComponent(process.env.ZOOM_REDIRECT_URI!)}` +
        `&state=${encodeURIComponent(state)}`;
      break;
    }
    default:
      throw new BadRequestException("Unsupported app type");
  }

  return { url: authUrl };
};

export const dissconencteService = async (
  userId: string,
  appType: IntegrationProviderEnum
) => {
  const UserIntegrationsRepo = AppDataSource.getRepository(Integration);
  const eventRepository = AppDataSource.getRepository(Event);

  const event = await eventRepository.findOne({
    where: {
      user: { id: userId },
      locationType:
        appType == "GOOGLE"
          ? EventLocationEnumType.GOOGLE_MEET_AND_CALENDAR
          : EventLocationEnumType.MICROSOFT_TEAMS_AND_OUTLOOK
    }
  });

  if (event) {
    event.isPrivate = !event.isPrivate;
    await eventRepository.save(event);
  }

  const integration = await UserIntegrationsRepo.findOne({
    where: { userId: userId, provider: appType }
  });

  if (!integration) {
    throw new Error("No integrations found");
  }

  switch (appType) {
    case IntegrationProviderEnum.GOOGLE: {
      await UserIntegrationsRepo.delete({
        userId,
        provider: IntegrationProviderEnum.GOOGLE
      });

      return {
        success: true,
        message: "Google integration disconnected successfully"
      };
    }
    case IntegrationProviderEnum.MICROSOFT: {
      await UserIntegrationsRepo.delete({
        userId,
        provider: IntegrationProviderEnum.MICROSOFT
      });
      return {
        success: true,
        message: "Microsoft integration disconnected successfully"
      };
    }
    case IntegrationProviderEnum.ZOOM: {
      await UserIntegrationsRepo.delete({
        userId,
        provider: IntegrationProviderEnum.ZOOM
      });
      return {
        success: true,
        message: "Microsoft integration disconnected successfully"
      };
    }
    default:
      throw new Error("Unsupported integration provider");
  }
};

export const createIntegrationService = async (data: {
  userId: string;
  provider: IntegrationProviderEnum;
  category: IntegrationCategoryEnum;
  app_type: IntegrationAppTypeEnum;
  access_token: string;
  refresh_token?: string;
  expiry_date: number | null;
  metadata: any;
}) => {
  const integrationRepository = AppDataSource.getRepository(Integration);
  const existingIntegration = await integrationRepository.findOne({
    where: {
      userId: data.userId,
      app_type: data.app_type
    }
  });

  console.log(existingIntegration);

  if (existingIntegration) {
    throw new BadRequestException(`${data.app_type} already connected`);
  }

  const integration = integrationRepository.create({
    provider: data.provider,
    category: data.category,
    app_type: data.app_type,
    access_token: data.access_token,
    refresh_token: data.refresh_token,
    expiry_date: data.expiry_date,
    metadata: data.metadata,
    userId: data.userId,
    isConnected: true
  });

  await integrationRepository.save(integration);

  return integration;
};

export const validateGoogleToken = async (
  accessToken: string,
  refreshToken: string,
  expiryDate: number | null
) => {
  if (expiryDate === null || Date.now() >= expiryDate) {
    googleOAuth2Client.setCredentials({
      refresh_token: refreshToken
    });
    const { credentials } = await googleOAuth2Client.refreshAccessToken();
    return credentials.access_token;
  }

  return accessToken;
};

export const getMicrosoftAccessToken = async (integration: Integration) => {
  const client = new ConfidentialClientApplication(msalConfig);
  const integrationMetadata = integration.metadata as any;
  const cacheData = integrationMetadata?.cacheData;

  if (!cacheData) {
    throw new Error("Microsoft token cache not found. Reconnect Microsoft.");
  }

  client.getTokenCache().deserialize(cacheData);

  const homeAccountId = integrationMetadata?.homeAccountId;

  if (!homeAccountId) {
    throw new Error(
      "Microsoft account information not found. Reconnect Microsoft."
    );
  }

  const account = await client
    .getTokenCache()
    .getAccountByHomeId(homeAccountId);

  if (!account) {
    throw new Error(
      "Microsoft account not found in token cache. Reconnect Microsoft."
    );
  }

  const tokenResponse = await client.acquireTokenSilent({
    account,
    scopes: ["User.Read", "Calendars.ReadWrite"]
  });

  if (!tokenResponse?.accessToken) {
    throw new Error("Could not acquire Microsoft access token");
  }

  return tokenResponse.accessToken;
};
