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
  getUserMeetingsService,
  processResourceAndAnswer
} from "./meeting.service";
import { HTTPSTATUS } from "../../core/config/http.config";
import { asyncHandler } from "../../core/middlewares/asyncHandler.middeware";
import {
  CreateMeetingDto,
  MeetingIdDTO,
  MeetingResourceDTO,
  MeetingTypeDto
} from "../../core/database/dto/meeting.dto";
import { AppDataSource } from "../../core/config/database.config";
import { Meeting } from "../../core/database/entities/meeting.entity";
import { Llm, LlmMessage } from "../../core/config/nvidia.config";
import { meetingPrompt } from "../../core/Prompts/meeting.prompt";

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

export const processResourceFile = asyncHandlerAndValidation(
  MeetingResourceDTO,
  "body",
  async (req: Request, res: Response, meetingResourceDto) => {
    const { meetingId, question } = req.body;
    const userId = req.user?.id as string;
    const meetingRepo = AppDataSource.getRepository(Meeting);
    const meeting = await meetingRepo.findOne({ where: { id: meetingId } });
    const files = req.files as Express.Multer.File[];

    const releventChunks = await processResourceAndAnswer(
      userId,
      meetingResourceDto,
      files
    );

    const message: LlmMessage[] = [
      {
        role: "system",
        content: meetingPrompt({
          MEETING_CONTEXT: JSON.stringify(meeting),
          USER_QUESTION: question,
          RETRIEVED_TRANSCRIPT: "",
          UPLOADED_RESOURCE_CHUNK: releventChunks.relevantPassages
        })
      }
    ];

    const llmResponse = await Llm.call(message);

    return res.status(HTTPSTATUS.CREATED).json({
      message: "Meeting scheduled successfully",
      data: {
        llmResponse
      }
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
