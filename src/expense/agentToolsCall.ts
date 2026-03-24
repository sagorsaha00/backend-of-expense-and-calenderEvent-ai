
import { createAgent,  } from "langchain";
import { model } from '../model/index'
import { MemorySaver } from "@langchain/langgraph-checkpoint";
import { initTools } from "./tool";





const checkpointer = new MemorySaver();






function buildSupervisorPrompt(userId: string): string {
    return `
You are a helpful personal assistant for expenses and calendar scheduling.
Current datetime: ${new Date().toISOString()}
The userId is: ${userId}

## Expense Management:
- Add expense: call add_expense with title, amount and userId
- View expenses: call get_expenses with userId
- Group expenses: call get_expenses_by_grouping with userId and groupBy (day/month/year)

## Calendar Management:
- Always parse natural language to ISO format first (e.g. 'next Tuesday 2pm' → '2026-03-24T14:00:00')
- Check availability: call get_available_time_slots with date and attendees
- Create event: call create_calendar_event with title, startTime, endTime, attendees, location
- Always confirm what was scheduled in your final response

## Rules:
- ALWAYS call the appropriate tool — never guess or make up data
- For calendar events, always use Asia/Dhaka timezone
- Break complex requests into multiple tool calls if needed
    `.trim();
}

export function createSupervisorAgent(userId: string) {
    console.log("userID", userId);

    const allTools = initTools(userId);
    const prompt = buildSupervisorPrompt(userId);

    return createAgent({
        model: model,
        tools: allTools,
        systemPrompt: prompt,
        checkpointer: checkpointer,
    });
}