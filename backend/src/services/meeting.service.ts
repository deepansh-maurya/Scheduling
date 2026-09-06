import { LessThan, MoreThan } from "typeorm";
import { AppDataSource } from "../config/database.config";
import {
  Meeting,
  MeetingStatus,
  MeetingType
} from "../database/entities/meeting.entity";
import {
  MeetingFilterEnum,
  MeetingFilterEnumType
} from "../enums/meeting.enum";
import { CreateMeetingDto } from "../database/dto/meeting.dto";
import {
  Event,
  EventLocationEnumType
} from "../database/entities/event.entity";
import {
  Integration,
  IntegrationAppTypeEnum,
  IntegrationCategoryEnum,
  IntegrationProviderEnum
} from "../database/entities/integration.entity";
import { BadRequestException, NotFoundException } from "../utils/app-error";
import { validateGoogleToken } from "./integration.service";
import { googleOAuth2Client } from "../config/oauth.config";
import { google } from "googleapis";
import { User } from "../database/entities/user.entity";

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

export const createMeetBookingForGuestService = async (
  createMeetingDto: CreateMeetingDto
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
    const response = await calendar.events.insert({
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

    meetLink = response.data.hangoutLink!;
    calendarEventId = response.data.id!;
    calendarAppType = calendarType;
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
          await calendar.events.delete({
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
  expiry_date: number | null
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
    default:
      throw new BadRequestException(
        `Unsupported Calendar provider: ${appType}`
      );
  }
}
