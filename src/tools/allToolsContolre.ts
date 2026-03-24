import { tool } from "langchain";
import { z } from "zod";
import { getCalendar } from "../store/tokenStore.js";


export function createCalendarTools(userId: string) {

    const createCalendarEvent = tool(
        async ({ title, startTime, endTime, attendees, location }: any) => {
            console.log("createCalendar event call");
            try {
                const calendar = await getCalendar(userId)
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

    const getAvailableTimeSlots = tool(
        async ({ attendees, date }) => {
            try {
                const calendar = await getCalendar(userId);

                const response = await calendar.freebusy.query({
                    requestBody: {
                        timeMin: `${date}T00:00:00Z`,
                        timeMax: `${date}T23:59:59Z`,
                        items: attendees.map((email) => ({ id: email })),
                    },
                });

                const firstAttendee = attendees[0];

                const busy =
                    response.data.calendars && firstAttendee
                        ? response.data.calendars[firstAttendee]?.busy || []
                        : ["No attendees provided."];

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


    return { createCalendarEvent, getAvailableTimeSlots, }
}