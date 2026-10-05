import { FunctionDeclaration, Type } from "@google/genai";

export const toolsDeclarations: FunctionDeclaration[] = [
  {
    name: "open_website",
    description: "Opens a website or web app (e.g. YouTube, Google, Wikipedia, GitHub, Twitter) in the connected in-app browser.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        url: {
          type: Type.STRING,
          description: "Full URL to open, e.g., 'https://www.youtube.com' or 'https://www.google.com'.",
        },
        title: {
          type: Type.STRING,
          description: "Human-readable title of the website, e.g., 'YouTube', 'Google'.",
        },
      },
      required: ["url"],
    },
  },
  {
    name: "play_media",
    description: "Plays a song, audio track, relaxing music, or YouTube video in the connected interactive media player.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        songOrQuery: {
          type: Type.STRING,
          description: "Name of the song, artist, mood, or video to play (e.g., 'Lofi Chill Beats', 'Kesariya', 'Minecraft Music').",
        },
        source: {
          type: Type.STRING,
          description: "Source type: 'youtube', 'lofi', 'acoustic', or 'ambient'.",
        },
      },
      required: ["songOrQuery"],
    },
  },
  {
    name: "search_web",
    description: "Performs a web or Google search and shows the results to the user.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        query: {
          type: Type.STRING,
          description: "The search query string, e.g., 'Minecraft update news', 'best recipes'.",
        },
      },
      required: ["query"],
    },
  },
  {
    name: "save_note",
    description: "Save a note, memo, draft, or idea to the user's notebook.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        title: {
          type: Type.STRING,
          description: "A short, descriptive title for the note.",
        },
        content: {
          type: Type.STRING,
          description: "The full content of the note.",
        },
        category: {
          type: Type.STRING,
          description: "Category, e.g., 'Ideas', 'Personal', 'Work', 'Study'.",
        },
      },
      required: ["title", "content"],
    },
  },
  {
    name: "manage_task",
    description: "Adds a new task or todo item to the user's checklist.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        taskText: {
          type: Type.STRING,
          description: "Description of the task to be completed.",
        },
        priority: {
          type: Type.STRING,
          description: "Priority level: 'low', 'medium', or 'high'.",
        },
        dueDate: {
          type: Type.STRING,
          description: "Optional due date or time descriptor.",
        },
      },
      required: ["taskText"],
    },
  },
  {
    name: "set_reminder",
    description: "Sets a reminder for the user at a specified time.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        reminderText: {
          type: Type.STRING,
          description: "What the user wants to be reminded of.",
        },
        time: {
          type: Type.STRING,
          description: "When the reminder should trigger (e.g., 'in 15 minutes', 'tomorrow 8 PM').",
        },
      },
      required: ["reminderText", "time"],
    },
  },
  {
    name: "remember_fact",
    description: "Remembers a personal detail, habit, or preference about the user into long-term memory.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        key: {
          type: Type.STRING,
          description: "Attribute name, e.g., 'userName', 'favoriteMusic', 'job', 'pet'.",
        },
        value: {
          type: Type.STRING,
          description: "The detail to remember.",
        },
      },
      required: ["key", "value"],
    },
  },
];
