import {
  IsDateString,
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID
} from "class-validator";
import { MeetingType } from "../entities/meeting.entity";

export class CreateMeetingDto {
  @IsString()
  @IsNotEmpty()
  eventId: string;

  @IsDateString()
  @IsNotEmpty()
  startTime: string;

  @IsDateString()
  @IsNotEmpty()
  endTime: string;

  @IsString()
  @IsNotEmpty()
  guestName: string;

  @IsEmail()
  @IsNotEmpty()
  guestEmail: string;

  @IsString()
  @IsOptional()
  additionalInfo: string;
}

export class MeetingIdDTO {
  @IsUUID(4, { message: "Invaild uuid" })
  @IsNotEmpty()
  meetingId: string;
}

export class MeetingTypeDto {
  @IsEnum(MeetingType)
  @IsNotEmpty()
  meetingType: MeetingType;
}
