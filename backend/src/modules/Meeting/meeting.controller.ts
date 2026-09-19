import { Request, Response } from "express";
import { asyncHandlerAndValidation } from "../../core/middlewares/withValidation.middleware";
import {
  MeetingFilterEnum,
  MeetingFilterEnumType
} from "../../core/enums/meeting.enum";
import {
  cancelMeetingService,
  createMeetBookingForGuestService,
  getmeetingsFromProvidersAndSave,
  getOutlookMeetingsFromProviderAndSave,
  getUserMeetingsService
} from "./meeting.service";
import { HTTPSTATUS } from "../../core/config/http.config";
import { asyncHandler } from "../../core/middlewares/asyncHandler.middeware";
import { CreateMeetingDto, MeetingIdDTO, MeetingTypeDto } from "../../core/database/dto/meeting.dto";

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
    const userId = req.user?.id as string;

    const { meetLink, meeting } = await createMeetBookingForGuestService(
      createMeetingDto,
      userId
    );
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
