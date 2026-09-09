import { Router } from "express";
import {
  cancelMeetingController,
  createMeetBookingForGuestController,
  getUserMeetingsController,
  syncMeetings
} from "../controllers/meeting.controller";
import { passportAuthenticateJwt } from "../config/passport.config";

const meetingRoutes = Router();

meetingRoutes.get(
  "/user/all/:meetingType",
  passportAuthenticateJwt,
  getUserMeetingsController
);

meetingRoutes.post("/public/create", createMeetBookingForGuestController);

meetingRoutes.post("/sync", passportAuthenticateJwt, syncMeetings);

meetingRoutes.put(
  "/cancel/:meetingId",
  passportAuthenticateJwt,
  cancelMeetingController
);

export default meetingRoutes;
