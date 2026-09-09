import { Request, Response } from "express";
import { asyncHandler } from "../middlewares/asyncHandler.middeware";
import { HTTPSTATUS } from "../config/http.config";
import {
  MeetingFilterEnum,
  MeetingFilterEnumType
} from "../enums/meeting.enum";
import {
  cancelMeetingService,
  createMeetBookingForGuestService,
  getmeetingsFromProvidersAndSave,
  getOutlookMeetingsFromProviderAndSave,
  getUserMeetingsService
} from "../services/meeting.service";
import { asyncHandlerAndValidation } from "../middlewares/withValidation.middleware";
import {
  CreateMeetingDto,
  MeetingIdDTO,
  MeetingTypeDto
} from "../database/dto/meeting.dto";

export const getUserMeetingsController = asyncHandlerAndValidation(
  MeetingTypeDto,
  "params",
  async (req: Request, res: Response, meetingType) => {
    const userId = req.user?.id as string;

    const filter =
      (req.query.filter as MeetingFilterEnumType) || MeetingFilterEnum.UPCOMING;

    const meetings = await getUserMeetingsService(
      userId,
      filter,
      meetingType.meetingType
    );

    return res.status(HTTPSTATUS.OK).json({
      message: "Meetings fetched successfully",
      meetings
    });
  }
);

export const syncMeetings = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.user?.id as string;

    await getmeetingsFromProvidersAndSave(userId);
    await getOutlookMeetingsFromProviderAndSave(userId);
    return res.status(HTTPSTATUS.OK).json({
      message: "Meetings synced successfully"
    });
  }
);

export const createMeetBookingForGuestController = asyncHandlerAndValidation(
  CreateMeetingDto,
  "body",
  async (req: Request, res: Response, createMeetingDto) => {
    const { meetLink, meeting } =
      await createMeetBookingForGuestService(createMeetingDto);
    return res.status(HTTPSTATUS.CREATED).json({
      message: "Meeting scheduled successfully",
      data: {
        meetLink,
        meeting
      }
    });
  }
);

export const cancelMeetingController = asyncHandlerAndValidation(
  MeetingIdDTO,
  "params",
  async (req: Request, res: Response, meetingIdDto) => {
    await cancelMeetingService(meetingIdDto.meetingId);
    return res.status(HTTPSTATUS.OK).json({
      messsage: "Meeting cancelled successfully"
    });
  }
);
