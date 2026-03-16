import { tool } from "langchain";
import { z } from "zod";
import { getCalendar } from "./server";
import { calendarAgent } from "./agentToolsCall";



export const createCalendarEvent = tool(
    async ({ title, startTime, endTime, attendees, location }: any) => {
        console.log("createCalendar event call");
        try {
            const calendar = getCalendar();

            const event = {
                summary: title,
                location: location,
                start: {
                    dateTime: startTime,
                    timeZone: "Asia/Dhaka",
                },
                end: {
                    dateTime: endTime,
                    timeZone: "Asia/Dhaka",
                },
                attendees: attendees.map((email: string) => ({ email })),
            };

            const response = await calendar.events.insert({
                calendarId: "primary",
                requestBody: event,
            });

            console.log("response", response.data);
            return `✅ Event created successfully!\nEvent Link: ${response.data.htmlLink}`;

        } catch (error: any) {
            console.error(error);
            return "❌ Failed to create event";
        }
    },
    {
        name: "create_calendar_event",
        description: "Create a calendar event. Requires exact ISO datetime format.",
        schema: z.object({
            title: z.string(),
            startTime: z.string().describe("ISO format: '2024-01-15T14:00:00'"),
            endTime: z.string().describe("ISO format: '2024-01-15T15:00:00'"),
            attendees: z.array(z.string()).describe("email addresses"),
            location: z.string().optional(),
        }),
    }
);

export const getAvailableTimeSlots = tool(
    async ({ attendees, date }) => {
        try {
            const calendar = getCalendar();

            const response = await calendar.freebusy.query({
                requestBody: {
                    timeMin: `${date}T00:00:00Z`,
                    timeMax: `${date}T23:59:59Z`,
                    items: attendees.map((email) => ({ id: email })),
                },
            });

            const busy =
                response.data.calendars && attendees.length > 0
                    ? response.data.calendars[attendees[0]]?.busy || []
                    : [];

            if (busy.length === 0) return ["All day free ✅"];

            return busy.map((b: any) => `Busy from ${b.start} to ${b.end}`);

        } catch (error) {
            console.log(error);
            return ["Error checking calendar"];
        }
    },
    {
        name: "get_available_time_slots",
        description: "Check busy times for given attendees on a specific date.",
        schema: z.object({
            attendees: z.array(z.string()),
            date: z.string().describe("ISO format: '2026-02-15'"),
        }),
    }
);

export const scheduleEvent = tool(
    async ({ request }) => {
        const result = await calendarAgent.invoke({
            messages: [{ role: "user", content: request }]
        });
        const lastMessage = result.messages[result.messages.length - 1];
        return lastMessage?.text;
    },
    {
        name: "schedule_event",
        description: `Schedule calendar events using natural language. Use this when the user wants to create, modify, or check calendar appointments.`,
        schema: z.object({
            request: z.string().describe("Natural language scheduling request"),
        }),
    }
);