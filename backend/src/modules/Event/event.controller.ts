import { Request, Response } from "express";
import { asyncHandlerAndValidation } from "../../core/middlewares/withValidation.middleware";

import {
  createEventService,
  deleteEventService,
  getPublicEventByUsernameAndSlugService,
  getPublicEventsByUsernameService,
  getUserEventsService,
  toggleEventPrivacyService
} from "./event.service";
import { HTTPSTATUS } from "../../core/config/http.config";
import { asyncHandler } from "../../core/middlewares/asyncHandler.middeware";
import { CreateEventDto, EventIdDTO, UserNameAndSlugDTO, UserNameDTO } from "../../core/database/dto/event.dto";

export const createEventController = asyncHandlerAndValidation(
  CreateEventDto,
  "body",
  async (req: Request, res: Response, createEventDto) => {
    const userId = req.user?.id as string;

    const event = await createEventService(userId, createEventDto);

    return res.status(HTTPSTATUS.CREATED).json({
      message: "Event created successfully",
      event
    });
  }
);

export const getUserEventsController = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.user?.id as string;
    const { events, username } = await getUserEventsService(userId);

    return res.status(HTTPSTATUS.OK).json({
      message: "User event fetched successfully",
      data: {
        events,
        username
      }
    });
  }
);

export const toggleEventPrivacyController = asyncHandlerAndValidation(
  EventIdDTO,
  "body",
  async (req: Request, res: Response, eventIdDto) => {
    const userId = req.user?.id as string;

    const event = await toggleEventPrivacyService(userId, eventIdDto.eventId);

    return res.status(HTTPSTATUS.OK).json({
      message: `Event set to ${
        event.isPrivate ? "private" : "public"
      } successfully`
    });
  }
);

export const getPublicEventsByUsernameController = asyncHandlerAndValidation(
  UserNameDTO,
  "params",

  async (req: Request, res: Response, userNameDto) => {
    const { user, events } = await getPublicEventsByUsernameService(
      userNameDto.username
    );

    return res.status(HTTPSTATUS.OK).json({
      message: "Public events fetched successfully",
      user,
      events
    });
  }
);

export const getPublicEventByUsernameAndSlugController =
  asyncHandlerAndValidation(
    UserNameAndSlugDTO,
    "params",
    async (req: Request, res: Response, userNameAndSlugDto) => {
      const event =
        await getPublicEventByUsernameAndSlugService(userNameAndSlugDto);

      return res.status(HTTPSTATUS.OK).json({
        message: "Event details fetched successfully",
        event
      });
    }
  );

export const deleteEventController = asyncHandlerAndValidation(
  EventIdDTO,
  "params",
  async (req: Request, res: Response, eventIdDto) => {
    const userId = req.user?.id as string;

    await deleteEventService(userId, eventIdDto.eventId);
    return res.status(HTTPSTATUS.OK).json({
      message: "Event deleted successfully"
    });
  }
);
