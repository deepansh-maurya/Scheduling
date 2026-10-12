import { Router } from "express";
import {
  cancelMeetingController,
  createMeetBookingForGuestController,
  getUserMeetingsController,
  processResourceFile,
  syncMeetings
} from "./meeting.controller";
import { httpAuthenticate } from "../../core/config/auth.config";
import { uploadResources } from "../../core/middlewares/file-upload.middleware";

const meetingRoutes = Router();

meetingRoutes.use(httpAuthenticate);

meetingRoutes.get("/user/all/:meetingType", getUserMeetingsController);

meetingRoutes.post("/public/create", createMeetBookingForGuestController);

meetingRoutes.post("/sync", syncMeetings);

meetingRoutes.post(
  "/upload",
  uploadResources.array("files", 5),
  processResourceFile
);

meetingRoutes.post("/upload", syncMeetings);

meetingRoutes.put(
  "/cancel/:meetingId",

  cancelMeetingController
);

export default meetingRoutes;
