import { Router } from "express";
import {
  createEventController,
  deleteEventController,
  getPublicEventByUsernameAndSlugController,
  getPublicEventsByUsernameController,
  getUserEventsController,
  toggleEventPrivacyController
} from "../controllers/event.controller";
import { httpAuthenticate } from "../../core/config/auth.config";

const eventRoutes = Router();

eventRoutes.use(httpAuthenticate);

eventRoutes.post("/create", createEventController);
eventRoutes.get("/all", getUserEventsController);

eventRoutes.get("/public/:username", getPublicEventsByUsernameController);

eventRoutes.get(
  "/public/:username/:slug",
  getPublicEventByUsernameAndSlugController
);

eventRoutes.put("/toggle-privacy", toggleEventPrivacyController);

eventRoutes.delete("/:eventId", deleteEventController);
export default eventRoutes;
