import googleMeetLogo from "@/assets/google-meet.svg";
import googleCalendarLogo from "@/assets/google-calendar.svg";
import microsoftTeamsLogo from "@/assets/microsoft-teams.svg";
import zoomLogo from "@/assets/zoom.svg";

export enum IntegrationAppEnum {
  GOOGLE_MEET_AND_CALENDAR = "GOOGLE_MEET_AND_CALENDAR",
  ZOOM = "ZOOM",
  MICROSOFT_TEAMS_AND_OUTLOOK = "MICROSOFT_TEAMS_AND_OUTLOOK",
  OUTLOOK_CALENDAR = "OUTLOOK_CALENDAR"
}

export const IntegrationLogos: Record<IntegrationAppType, string | string[]> = {
  GOOGLE_MEET_AND_CALENDAR: [googleMeetLogo, googleCalendarLogo],
  ZOOM: zoomLogo,
  MICROSOFT_TEAMS_AND_OUTLOOK: microsoftTeamsLogo
};

export type IntegrationProviderType = "GOOGLE" | "MICROSOFT" | "ZOOM";

export type IntegrationAppType =
  | "GOOGLE_MEET_AND_CALENDAR"
  | "ZOOM"
  | "MICROSOFT_TEAMS_AND_OUTLOOK";

export type IntegrationTitleType =
  | "Google Meet & Calendar"
  | "Zoom"
  | "Microsoft Teams";

export const IntegrationDescriptions: Record<IntegrationAppType, string> = {
  GOOGLE_MEET_AND_CALENDAR:
    "Include Google Meet details in your Meetly events and sync with Google Calendar.",
  ZOOM: "Include Zoom details in your Meetly events.",
  MICROSOFT_TEAMS_AND_OUTLOOK:
    "Microsoft Teams integration for video conferencing and collaboration."
};

export enum VideoConferencingPlatform {
  GOOGLE_MEET_AND_CALENDAR = IntegrationAppEnum.GOOGLE_MEET_AND_CALENDAR,
  ZOOM = IntegrationAppEnum.ZOOM,
  MICROSOFT_TEAMS_AND_OUTLOOK = IntegrationAppEnum.MICROSOFT_TEAMS_AND_OUTLOOK
}

export type MeetingType = "EVENT_BOOKING" | "CALENDAR_EVENT";

export const locationOptions = [
  {
    label: "Google Meet",
    value: VideoConferencingPlatform.GOOGLE_MEET_AND_CALENDAR,
    logo: IntegrationLogos.GOOGLE_MEET_AND_CALENDAR?.[0],
    isAvailable: true
  },
  {
    label: "Zoom",
    value: VideoConferencingPlatform.ZOOM,
    logo: IntegrationLogos.ZOOM,
    isAvailable: true
  },
  {
    label: "Microsoft",
    value: VideoConferencingPlatform.MICROSOFT_TEAMS_AND_OUTLOOK,
    logo: IntegrationLogos.MICROSOFT_TEAMS_AND_OUTLOOK,
    isAvailable: true
  }
];
