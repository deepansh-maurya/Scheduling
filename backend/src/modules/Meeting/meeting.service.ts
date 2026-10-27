import { LessThan, MoreThan } from "typeorm";
import Tesseract from "tesseract.js";
import { randomUUID } from "node:crypto";

import ollama from "ollama";
import axios from "axios";
import {
  getMicrosoftAccessToken,
  validateGoogleToken
} from "../Integration/integration.service";
import {
  MeetingFilterEnum,
  MeetingFilterEnumType
} from "../../core/enums/meeting.enum";
import {
  Meeting,
  MeetingStatus,
  MeetingType
} from "../../core/database/entities/meeting.entity";
import {
  AppDataSource,
  elasticsearch
} from "../../core/config/database.config";
import {
  Integration,
  IntegrationAppTypeEnum,
  IntegrationProviderEnum
} from "../../core/database/entities/integration.entity";
import { User } from "../../core/database/entities/user.entity";
import { googleOAuth2Client } from "../../core/config/oauth.config";
import { google } from "googleapis";
import {
  CreateMeetingDto,
  MeetingResourceDTO
} from "../../core/database/dto/meeting.dto";
import {
  Event,
  EventLocationEnumType
} from "../../core/database/entities/event.entity";
import {
  BadRequestException,
  NotFoundException
} from "../../core/utils/app-error";
import { TranscriptChunk } from "../../core/database/entities/transcript-chunk.entity";
import { redisClient } from "../../core/config/redis.config";
import { uploadToMinio } from "../../core/services/core.services";
import {
  Resource,
  ResourceType
} from "../../core/database/entities/resources.entity";
import {
  ResourceProcessingJob,
  ResourceProcessingStatus
} from "../../core/database/entities/resource-processing-jobs.entity";
import { resourceQueue } from "../../core/config/bullmq.config";

export const getUserMeetingsService = async (
  userId: string,
  filter: MeetingFilterEnumType,
  meetingType: MeetingType
) => {
  const meetingRepository = AppDataSource.getRepository(Meeting);

  const where: any = { user: { id: userId } };

  where.meetingType =
    meetingType == MeetingType.CALENDAR_EVENT
      ? MeetingType.CALENDAR_EVENT
      : MeetingType.EVENT_BOOKING;

  if (filter === MeetingFilterEnum.UPCOMING) {
    where.status = MeetingStatus.SCHEDULED;
    where.startTime = MoreThan(new Date());
  } else if (filter === MeetingFilterEnum.PAST) {
    where.status = MeetingStatus.SCHEDULED;
    where.startTime = LessThan(new Date());
  } else if (filter === MeetingFilterEnum.CANCELLED) {
    where.status = MeetingStatus.CANCELLED;
  } else {
    where.status = MeetingStatus.SCHEDULED;
    where.startTime = MoreThan(new Date());
  }

  const meetings = await meetingRepository.find({
    where,
    relations: ["event"],
    order: { startTime: "ASC" }
  });

  return meetings || [];
};

export const getmeetingsFromProvidersAndSave = async (userId: string) => {
  const UserIntegrationsRepo = AppDataSource.getRepository(Integration);

  const MeetingRepo = AppDataSource.getRepository(Meeting);

  const userRepository = AppDataSource.getRepository(User);

  const user = await userRepository.findOne({
    where: { id: userId }
  });

  if (!user) {
    throw new Error("User not found");
  }

  const integration = await UserIntegrationsRepo.findOne({
    where: {
      userId,
      provider: IntegrationProviderEnum.GOOGLE
    }
  });

  if (!integration) {
    throw new Error("Google Calendar is not connected");
  }

  googleOAuth2Client.setCredentials({
    access_token: integration.access_token,
    refresh_token: integration.refresh_token
  });

  const calendar = google.calendar({
    version: "v3",
    auth: googleOAuth2Client
  });

  const response = await calendar.events.list({
    calendarId: "primary",
    timeMin: new Date().toISOString(),
    singleEvents: true,
    orderBy: "startTime"
  });

  const events = response.data.items || [];

  for (const googleEvent of events) {
    if (!googleEvent.id) continue;

    const existingMeeting = await MeetingRepo.findOne({
      where: {
        user: {
          id: userId
        },
        calendarEventId: googleEvent.id
      }
    });

    if (
      existingMeeting &&
      existingMeeting.meetingType === MeetingType.EVENT_BOOKING
    ) {
      continue;
    }

    const attendees =
      googleEvent.attendees?.map((attendee) => ({
        name: attendee.displayName || undefined,
        email: attendee.email || undefined,
        responseStatus: attendee.responseStatus || undefined
      })) || null;

    const startTime = googleEvent.start?.dateTime || googleEvent.start?.date;

    const endTime = googleEvent.end?.dateTime || googleEvent.end?.date;

    if (!startTime || !endTime) continue;

    const meetingData = {
      title: googleEvent.summary || "",
      description: googleEvent.description || "",
      startTime: new Date(startTime),
      endTime: new Date(endTime),
      attendees,
      calendarEventId: googleEvent.id,
      calendarAppType: IntegrationAppTypeEnum.GOOGLE_MEET_AND_CALENDAR,
      meetingType: MeetingType.CALENDAR_EVENT,
      status:
        googleEvent.status === "cancelled"
          ? MeetingStatus.CANCELLED
          : MeetingStatus.SCHEDULED,
      meetLink:
        googleEvent.hangoutLink ||
        googleEvent.conferenceData?.entryPoints?.find(
          (entry) => entry.entryPointType === "video"
        )?.uri ||
        null
    };

    if (existingMeeting) {
      await MeetingRepo.update(existingMeeting.id, meetingData);
    } else {
      const meeting = new Meeting();

      meeting.user = user;
      meeting.event = null;
      meeting.title = googleEvent.summary ?? "";
      meeting.description = googleEvent.description ?? null;

      meeting.startTime = new Date(startTime);
      meeting.endTime = new Date(endTime);

      meeting.attendees = attendees;

      meeting.calendarEventId = googleEvent.id;

      meeting.calendarAppType = IntegrationAppTypeEnum.GOOGLE_MEET_AND_CALENDAR;

      meeting.meetingType = MeetingType.CALENDAR_EVENT;

      meeting.status =
        googleEvent.status === "cancelled"
          ? MeetingStatus.CANCELLED
          : MeetingStatus.SCHEDULED;

      meeting.meetLink =
        googleEvent.hangoutLink ??
        googleEvent.conferenceData?.entryPoints?.find(
          (entry) => entry.entryPointType === "video"
        )?.uri ??
        null;

      meeting.guestName = null;
      meeting.guestEmail = null;
      meeting.additionalInfo = null;

      await MeetingRepo.save(meeting);
    }
  }
};

export const getOutlookMeetingsFromProviderAndSave = async (userId: string) => {
  const UserIntegrationsRepo = AppDataSource.getRepository(Integration);
  const MeetingRepo = AppDataSource.getRepository(Meeting);
  const userRepository = AppDataSource.getRepository(User);

  const user = await userRepository.findOne({
    where: { id: userId }
  });

  if (!user) {
    throw new Error("User not found");
  }

  const integration = await UserIntegrationsRepo.findOne({
    where: {
      userId,
      provider: IntegrationProviderEnum.MICROSOFT
    }
  });

  if (!integration) {
    throw new Error("Microsoft Outlook Calendar is not connected");
  }

  const response = await axios.get(
    "https://graph.microsoft.com/v1.0/me/events",
    {
      headers: {
        Authorization: `Bearer ${integration.access_token}`
      },

      params: {
        $orderby: "start/dateTime",
        $top: 100
      }
    }
  );

  const events = response.data.value || [];

  for (const outlookEvent of events) {
    if (!outlookEvent.id) {
      continue;
    }

    const existingMeeting = await MeetingRepo.findOne({
      where: {
        user: {
          id: userId
        },

        calendarEventId: outlookEvent.id
      }
    });

    if (
      existingMeeting &&
      existingMeeting.meetingType === MeetingType.EVENT_BOOKING
    ) {
      continue;
    }

    const attendees =
      outlookEvent.attendees?.map((attendee: any) => ({
        name: attendee.emailAddress?.name || undefined,

        email: attendee.emailAddress?.address || undefined,

        responseStatus: attendee.status?.response || undefined
      })) || null;

    const startTime = outlookEvent.start?.dateTime;

    const endTime = outlookEvent.end?.dateTime;

    if (!startTime || !endTime) {
      continue;
    }

    const meetLink = outlookEvent.onlineMeeting?.joinUrl || null;

    const meetingData = {
      title: outlookEvent.subject || "",
      description: outlookEvent.bodyPreview || null,
      startTime: new Date(startTime),
      endTime: new Date(endTime),
      attendees,
      calendarEventId: outlookEvent.id,
      calendarAppType: IntegrationAppTypeEnum.MICROSOFT_TEAMS_AND_OUTLOOK,
      meetingType: MeetingType.CALENDAR_EVENT,
      status: outlookEvent.isCancelled
        ? MeetingStatus.CANCELLED
        : MeetingStatus.SCHEDULED,
      meetLink
    };

    if (existingMeeting) {
      await MeetingRepo.update(existingMeeting.id, meetingData);
    } else {
      const meeting = new Meeting();
      meeting.user = user;
      meeting.event = null;
      meeting.title = meetingData.title;
      meeting.description = meetingData.description;
      meeting.startTime = meetingData.startTime;
      meeting.endTime = meetingData.endTime;
      meeting.attendees = meetingData.attendees;
      meeting.calendarEventId = meetingData.calendarEventId;
      meeting.calendarAppType = meetingData.calendarAppType;
      meeting.meetingType = meetingData.meetingType;
      meeting.status = meetingData.status;
      meeting.meetLink = meetingData.meetLink;
      meeting.guestName = null;
      meeting.guestEmail = null;
      meeting.additionalInfo = null;
      await MeetingRepo.save(meeting);
    }
  }

  return {
    message: "Outlook Calendar meetings synchronized successfully",

    count: events.length
  };
};

export const createMeetBookingForGuestService = async (
  createMeetingDto: CreateMeetingDto,
  userId: string
) => {
  const { eventId, guestEmail, guestName, additionalInfo } = createMeetingDto;
  const startTime = new Date(createMeetingDto.startTime);
  const endTime = new Date(createMeetingDto.endTime);

  const eventRepository = AppDataSource.getRepository(Event);
  const integrationRepository = AppDataSource.getRepository(Integration);
  const meetingRepository = AppDataSource.getRepository(Meeting);

  const event = await eventRepository.findOne({
    where: { id: eventId, isPrivate: false },
    relations: ["user"]
  });

  if (!event) throw new NotFoundException("Event not found");

  if (!Object.values(EventLocationEnumType).includes(event.locationType)) {
    throw new BadRequestException("Invalid location type");
  }

  const meetIntegration = await integrationRepository.findOne({
    where: {
      user: { id: event.user.id },
      app_type: IntegrationAppTypeEnum[event.locationType]
    }
  });

  if (!meetIntegration)
    throw new BadRequestException("No video conferencing integration found");

  let meetLink: string = "";
  let calendarEventId: string = "";
  let calendarAppType: string = "";

  if (event.locationType === EventLocationEnumType.GOOGLE_MEET_AND_CALENDAR) {
    const { calendarType, calendar } = await getCalendarClient(
      meetIntegration.app_type,
      meetIntegration.access_token,
      meetIntegration.refresh_token,
      meetIntegration.expiry_date
    );
    const response = await calendar?.events.insert({
      calendarId: "primary",
      conferenceDataVersion: 1,
      requestBody: {
        summary: `${guestName} - ${event.title}`,
        description: additionalInfo,
        start: { dateTime: startTime.toISOString() },
        end: { dateTime: endTime.toISOString() },
        attendees: [{ email: guestEmail }, { email: event.user.email }],
        conferenceData: {
          createRequest: {
            requestId: `${event.id}-${Date.now()}`
          }
        }
      }
    });

    meetLink = response?.data.hangoutLink!;
    calendarEventId = response?.data.id!;
    calendarAppType = calendarType;
  } else if (
    event.locationType === EventLocationEnumType.MICROSOFT_TEAMS_AND_OUTLOOK
  ) {
    const { accessToken, calendarType } = await getCalendarClient(
      meetIntegration.app_type,
      meetIntegration.access_token,
      meetIntegration.refresh_token!,
      meetIntegration.expiry_date,
      userId
    );

    const response = await axios.post(
      "https://graph.microsoft.com/v1.0/me/events",
      {
        subject: `${guestName} - ${event.title}`,

        body: {
          contentType: "Text",
          content: additionalInfo || ""
        },

        start: {
          dateTime: startTime.toISOString(),
          timeZone: "UTC"
        },

        end: {
          dateTime: endTime.toISOString(),
          timeZone: "UTC"
        },

        attendees: [
          {
            emailAddress: {
              address: guestEmail,
              name: guestName
            },
            type: "required"
          },
          {
            emailAddress: {
              address: event.user.email,
              name: event.user.name
            },
            type: "required"
          }
        ],

        isOnlineMeeting: true,

        onlineMeetingProvider: "teamsForBusiness"
      },
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json"
        }
      }
    );

    meetLink = response.data.onlineMeeting?.joinUrl || null;
    calendarEventId = response.data.id || "";
    calendarAppType = calendarType;
  } else if (event.locationType === EventLocationEnumType.ZOOM) {
    let accessToken = meetIntegration.access_token;

    if (
      meetIntegration.expiry_date &&
      Date.now() >= Number(meetIntegration.expiry_date) - 60_000
    ) {
      if (!meetIntegration.refresh_token) {
        throw new BadRequestException(
          "Zoom refresh token not available. Please reconnect Zoom."
        );
      }

      const credentials = Buffer.from(
        `${process.env.ZOOM_CLIENT_ID}:${process.env.ZOOM_CLIENT_SECRET}`
      ).toString("base64");

      const refreshResponse = await axios.post(
        "https://zoom.us/oauth/token",
        new URLSearchParams({
          grant_type: "refresh_token",
          refresh_token: meetIntegration.refresh_token
        }).toString(),
        {
          headers: {
            Authorization: `Basic ${credentials}`,
            "Content-Type": "application/x-www-form-urlencoded"
          }
        }
      );

      accessToken = refreshResponse.data.access_token;

      meetIntegration.access_token = refreshResponse.data.access_token;

      if (refreshResponse.data.refresh_token) {
        meetIntegration.refresh_token = refreshResponse.data.refresh_token;
      }

      if (refreshResponse.data.expires_in) {
        meetIntegration.expiry_date =
          Date.now() + refreshResponse.data.expires_in * 1000;
      }

      await integrationRepository.save(meetIntegration);
    }

    const duration = Math.ceil(
      (endTime.getTime() - startTime.getTime()) / 60000
    );

    const response = await axios.post(
      "https://api.zoom.us/v2/users/me/meetings",
      {
        topic: `${guestName} - ${event.title}`,
        type: 2,
        start_time: startTime.toISOString(),
        duration,
        agenda: additionalInfo || "",
        settings: {
          waiting_room: true
        }
      },
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json"
        }
      }
    );

    meetLink = response.data?.join_url || null;
    calendarEventId = response.data?.id ? String(response.data.id) : "";
    calendarAppType = IntegrationAppTypeEnum.ZOOM;
  }

  const meeting = meetingRepository.create({
    event: { id: event.id },
    user: event.user,
    guestName,
    guestEmail,
    additionalInfo,
    startTime,
    endTime,
    meetLink: meetLink,
    calendarEventId: calendarEventId,
    calendarAppType: calendarAppType as IntegrationAppTypeEnum,
    meetingType: MeetingType.EVENT_BOOKING
  });

  await meetingRepository.save(meeting);

  return {
    meetLink,
    meeting
  };
};

export const cancelMeetingService = async (meetingId: string) => {
  const meetingRepository = AppDataSource.getRepository(Meeting);
  const integrationRepository = AppDataSource.getRepository(Integration);

  const meeting = await meetingRepository.findOne({
    where: { id: meetingId },
    relations: ["event", "event.user"]
  });
  if (!meeting) throw new NotFoundException("Meeting not found");

  try {
    const calendarIntegration = await integrationRepository.findOne({
      where: {
        app_type:
          IntegrationAppTypeEnum[
            meeting.calendarAppType as keyof typeof IntegrationAppTypeEnum
          ]
      }
    });

    // const calendarIntegration = await integrationRepository.findOne({
    //   where: [
    //     {
    //       user: { id: meeting.event.user.id },
    //       category: IntegrationCategoryEnum.CALENDAR_AND_VIDEO_CONFERENCING,
    //     },
    //     {
    //       user: { id: meeting.event.user.id },
    //       category: IntegrationCategoryEnum.CALENDAR,
    //     },
    //   ],
    // });

    if (calendarIntegration) {
      const { calendar, calendarType } = await getCalendarClient(
        calendarIntegration.app_type,
        calendarIntegration.access_token,
        calendarIntegration.refresh_token,
        calendarIntegration.expiry_date
      );
      switch (calendarType) {
        case IntegrationAppTypeEnum.GOOGLE_MEET_AND_CALENDAR:
          await calendar?.events.delete({
            calendarId: "primary",
            eventId: meeting.calendarEventId
          });
          break;
        default:
          throw new BadRequestException(
            `Unsupported calendar provider: ${calendarType}`
          );
      }
    }
  } catch (error) {
    throw new BadRequestException("Failed to delete event from calendar");
  }

  meeting.status = MeetingStatus.CANCELLED;
  await meetingRepository.save(meeting);
  return { success: true };
};

async function getCalendarClient(
  appType: IntegrationAppTypeEnum,
  access_token: string,
  refresh_token: string,
  expiry_date: number | null,
  userId?: string
) {
  switch (appType) {
    case IntegrationAppTypeEnum.GOOGLE_MEET_AND_CALENDAR:
      const validToken = await validateGoogleToken(
        access_token,
        refresh_token,
        expiry_date
      );
      googleOAuth2Client.setCredentials({ access_token: validToken });
      const calendar = google.calendar({
        version: "v3",
        auth: googleOAuth2Client
      });
      return {
        calendar,
        calendarType: IntegrationAppTypeEnum.GOOGLE_MEET_AND_CALENDAR
      };

    case IntegrationAppTypeEnum.MICROSOFT_TEAMS_AND_OUTLOOK: {
      const integrationRepo = AppDataSource.getRepository(Integration);
      const integration = await integrationRepo.findOne({
        where: { userId: userId }
      });

      if (!integration) {
        throw new BadRequestException(
          "Microsoft Teams and Outlook integration not found"
        );
      }

      const accessToken = await getMicrosoftAccessToken(integration);

      return {
        provider: "MICROSOFT" as const,
        accessToken: accessToken,
        calendarType: IntegrationAppTypeEnum.MICROSOFT_TEAMS_AND_OUTLOOK
      };
    }

    default:
      throw new BadRequestException(
        `Unsupported Calendar provider: ${appType}`
      );
  }
}

export async function processResourceAndAnswer(
  userId: string,
  meetingResourceDto: MeetingResourceDTO,
  files: Express.Multer.File[]
) {
  const { meetingId, question } = meetingResourceDto;
  console.log("meetingid", meetingId, "question", question);

  const uploadId = randomUUID();

  const fileContent: {
    fileName: string;
    mimeType: string;
    extractedText: string;
  }[] = [];

  const extractedTexts = await Promise.all(
    files.map(async (file) => {
      if (file.mimetype === "text/plain") {
        const text = file.buffer.toString("utf-8");

        fileContent.push({
          extractedText: text,
          mimeType: file.mimetype,
          fileName: file.originalname
        });

        await uploadToMinioAndSaveLog(
          userId,
          file,
          meetingId,
          text,
          false,
          ResourceType.TXT
        );

        return text;
      }

      if (file.mimetype.startsWith("image/")) {
        const result = await Tesseract.recognize(file.buffer, "eng");
        const text = result.data.text;

        fileContent.push({
          extractedText: text,
          mimeType: file.mimetype,
          fileName: file.originalname
        });

        await uploadToMinioAndSaveLog(
          userId,
          file,
          meetingId,
          text,
          true,
          ResourceType.IMAGE
        );

        return text;
      }

      throw new Error(`Unsupported file type: ${file.mimetype}`);
    })
  );

  const passages = extractedTexts.flatMap((text) => splitTextIntoChunks(text));

  console.log(passages, "passages");

  if (!passages.length) {
    throw new Error("No searchable text could be extracted");
  }

  await redisClient.sAdd(`user:${userId}:uploads`, uploadId);

  await indexTemporaryPassages({ uploadId, userId, meetingId, passages });

  const relevantPassages = await searchBM25({
    uploadId,
    userId,
    passages: passages as string[],
    question,
    topK: 5,
    meetingId
  });

  return {
    uploadId,
    meetingId,
    relevantPassages
  };
}

export function splitTextIntoChunks(
  text: string,
  chunkSize = 1000,
  overlap = 150
): string[] {
  const normalizedText = text.replace(/\s+/g, " ").trim();

  if (!normalizedText) return [];

  if (overlap >= chunkSize) {
    throw new Error("Overlap must be smaller than chunkSize");
  }

  const chunks: string[] = [];
  let start = 0;

  while (start < normalizedText.length) {
    const end = Math.min(start + chunkSize, normalizedText.length);
    chunks.push(normalizedText.slice(start, end));

    if (end === normalizedText.length) break;

    start = end - overlap;
  }

  return chunks;
}

export async function uploadToMinioAndSaveLog(
  userId: string,
  file: Express.Multer.File,
  meetingId: string,
  text: string,
  storeTxt: boolean,
  type: string
) {
  const resourceRepo = AppDataSource.getRepository(Resource);
  const resourceJobRepo = AppDataSource.getRepository(ResourceProcessingJob);

  const resp = await uploadToMinio(userId, file, meetingId);

  const resource = resourceRepo.create({
    fileName: file.originalname,
    meetingId: meetingId,
    mimeType: file.mimetype,
    type: type as any,
    userId: userId,
    storageKey: resp.objectKey,
    resourceTxt: storeTxt ? text : null
  });

  await resourceRepo.save(resource);

  const resourceJob = resourceJobRepo.create({
    file_id: resource.id,
    meeting_id: meetingId,
    file_type: file.mimetype,
    raw_minio_key: resp.objectKey,
    text_minio_key: null,
    status: ResourceProcessingStatus.PENDING,
    attempts: 0
  });

  await resourceJobRepo.save(resourceJob);

  await resourceQueue.add(
    "process-file",
    {
      fileId: resource.id,
      userId,
      meetingId,
      fileType: file.mimetype,
      minioKey: resp.objectKey
    },
    {
      jobId: resource.id,
      attempts: 3,
      backoff: {
        type: "exponential",
        delay: 2000
      },
      removeOnComplete: true,
      removeOnFail: false
    }
  );
}

interface SearchBM25Params {
  uploadId: string;
  userId: string;
  passages: string[];
  meetingId: string;
  question: string;
  topK?: number;
}

interface SearchBM25Params {
  uploadId: string;
  userId: string;
  meetingId: string;
  question: string;
  topK?: number;
}

interface IndexTemporaryPassagesParams {
  uploadId: string;
  userId: string;
  meetingId: string;
  passages: string[];
}

export async function indexTemporaryPassages({
  uploadId,
  userId,
  meetingId,
  passages
}: IndexTemporaryPassagesParams): Promise<void> {
  const indexName = "meetly_temporary";

  if (passages.length === 0) return;

  const operations = passages.flatMap((content, i) => [
    {
      index: {
        _index: indexName,
        _id: `${uploadId}-${i}`
      }
    },
    {
      uploadId,
      userId,
      meetingId,
      content
    }
  ]);
  console.log(operations, "operations");
  const bulkResult = await elasticsearch.bulk({
    operations,
    refresh: true
  });

  console.log(bulkResult, "bulk result ");

  if (bulkResult.errors) {
    throw new Error("Failed to index some temporary passages");
  }
}

export async function searchBM25({
  uploadId,
  userId,
  meetingId,
  question,
  topK = 5
}: SearchBM25Params): Promise<string[]> {
  const result = await elasticsearch.search({
    index: "meetly_temporary",
    size: topK,
    query: {
      bool: {
        filter: [
          { term: { uploadId } },
          { term: { userId } },
          { term: { meetingId } }
        ],
        must: [{ match: { content: question } }]
      }
    }
  });

  console.log(result, "index result");

  return result.hits.hits.flatMap((hit) => {
    const source = hit._source as { content?: string } | undefined;

    return source?.content ? [source.content] : [];
  });
}
