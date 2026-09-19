import { Router } from "express";
import {
  cancelMeetingController,
  createMeetBookingForGuestController,
  getUserMeetingsController,
  syncMeetings
} from "./meeting.controller";
import { httpAuthenticate } from "../../core/config/auth.config";

const meetingRoutes = Router();

meetingRoutes.use(httpAuthenticate);

meetingRoutes.get("/user/all/:meetingType", getUserMeetingsController);

meetingRoutes.post("/public/create", createMeetBookingForGuestController);

meetingRoutes.post("/sync", syncMeetings);

meetingRoutes.put(
  "/cancel/:meetingId",

  cancelMeetingController
);

export default meetingRoutes;
