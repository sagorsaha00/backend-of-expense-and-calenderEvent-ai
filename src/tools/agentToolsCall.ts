
import { createAgent, humanInTheLoopMiddleware } from "langchain";
import { model } from '../model/index'
import { MemorySaver } from "@langchain/langgraph-checkpoint";
import { createCalendarEvent, getAvailableTimeSlots, scheduleEvent } from "./allToolsContolre";
import { initTools } from "../expense/tool";




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


const SUPERVISOR_PROMPT = `
You are a helpful personal assistant for expenses and calendar scheduling.

Your job:
- Understand the user request
- Use tools when needed
- Schedule calendar events
- Create calendar events
- Check available time slots
- Manage expenses: add, view, group expenses

For expenses: the current datetime is ${new Date().toISOString()}; when the user provides a title and amount you MUST call the add_expense tool with those exact values and the userId to store the record, and when the user asks to view, list, or show expenses you MUST call the get_expenses tool with the userId and return the formatted results to the user and if user ask for grouping or chart the expenses by day, month, or year you MUST call the get_expenses_by_grouping tool with the userId and this tool proper way excute with those exact values to get the formatted results to the user.
For calendar: Parse natural language scheduling requests (e.g., 'next Tuesday at 2pm') into proper ISO datetime formats. Use get_available_time_slots to check availability when needed. Use create_calendar_event to schedule events. Always confirm what was scheduled in your final response.
The userId is {userId}.

Break user requests into appropriate tool calls and coordinate the results.
`.trim();

export function createSupervisorAgent(userId: string) {
    const expenseTools = initTools();
    const allTools = [...expenseTools, scheduleEvent, createCalendarEvent, getAvailableTimeSlots];
    const prompt = SUPERVISOR_PROMPT.replace("{userId}", userId);

    return createAgent({
        model: model,
        tools: allTools,
        systemPrompt: prompt,
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
}