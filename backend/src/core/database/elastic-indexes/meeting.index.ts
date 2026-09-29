import { elasticsearch } from "../../config/database.config";

export const meetingIndex = async () => {
  await elasticsearch.indices.create({
    index: "meetly_content",

    mappings: {
      properties: {
        id: {
          type: "keyword"
        },

        type: {
          type: "keyword"
        },

        userId: {
          type: "keyword"
        },

        meetingId: {
          type: "keyword"
        },

        content: {
          type: "text"
        },

        speakerIds: {
          type: "keyword"
        },

        startTime: {
          type: "double"
        },

        endTime: {
          type: "double"
        },

        resourceId: {
          type: "keyword"
        },

        ocrText: {
          type: "text"
        },

        caption: {
          type: "text"
        },

        createdAt: {
          type: "date"
        }
      }
    }
  });
};
