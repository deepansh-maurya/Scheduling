import { Router } from "express";
import { httpAuthenticate } from "../../core/config/auth.config";
import {
  getAvailabilityForPublicEventController,
  getUserAvailabilityController,
  updateAvailabilityController
} from "../controllers/availability.controller";

const availabilityRoutes = Router();

availabilityRoutes.use(httpAuthenticate);

availabilityRoutes.get("/me", getUserAvailabilityController);

availabilityRoutes.get(
  "/public/:eventId",
  getAvailabilityForPublicEventController
);

availabilityRoutes.put("/update", updateAvailabilityController);
export default availabilityRoutes;
