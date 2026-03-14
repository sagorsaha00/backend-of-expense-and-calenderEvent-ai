
import { createAgent, humanInTheLoopMiddleware } from "langchain";
import { model } from './model/index'
import { MemorySaver } from "@langchain/langgraph-checkpoint";
import { createCalendarEvent, getAvailableTimeSlots, scheduleEvent } from "./alltoll";




const checkpointer = new MemorySaver();



const CALENDAR_AGENT_PROMPT = `
You are a calendar scheduling assistant.
Parse natural language scheduling requests (e.g., 'next Tuesday at 2pm')
into proper ISO datetime formats.
Use get_available_time_slots to check availability when needed.
Use create_calendar_event to schedule events.
Always confirm what was scheduled in your final response.
`.trim();

export const calendarAgent = createAgent({
    model: model,
    tools: [createCalendarEvent, getAvailableTimeSlots,],
    systemPrompt: CALENDAR_AGENT_PROMPT,
    middleware: [
        humanInTheLoopMiddleware({
            interruptOn: { create_calendar_event: true },
            descriptionPrefix: "Calendar event pending approval",
        }),
    ],
});


export const SUPERVISOR_PROMPT = `
You are a helpful personal assistant.

Your job:
- Understand the user request
- Use tools when needed
- Schedule calendar events
- Create calendar events
- Check available time slots

Break user requests into appropriate tool calls and coordinate the results.
`.trim();
console.log("serpervisor agent call")
export const supervisorAgent = createAgent({
    model: model,
    tools: [scheduleEvent, createCalendarEvent, getAvailableTimeSlots],
    systemPrompt: SUPERVISOR_PROMPT,
    middleware: [
        humanInTheLoopMiddleware({
            interruptOn: {
                create_calendar_event: true,
            },
            descriptionPrefix: "Tool execution pending approval",
        }),
    ],

    checkpointer: checkpointer,
});