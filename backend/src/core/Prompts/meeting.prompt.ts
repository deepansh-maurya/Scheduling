interface MeetingPrompt {
  MEETING_CONTEXT?: string;
  USER_QUESTION?: string;
  RECENT_TRANSCRIPT?: string;
  RETRIEVED_TRANSCRIPT?: string;
  SCREEN_CONTEXT?: string;
  FILES_CONTEXT?: string[] | string;
  CONVERSATION_HISTORY?: string;
  UPLOADED_RESOURCE_CHUNK: string[];
}

export const meetingPrompt = (input: MeetingPrompt) => {
  return `

  <role>
  You are a helper for a user who is asking questions to you. You can only help if you have context regarding the query otherwise return any rejection answer
  </role>

  <rules>
  You will be given data in lot of formats images, and text with user query 
  asnwer based on provided context , never assumpt anything give answers based on provided data 
  </rules>

`;
};
