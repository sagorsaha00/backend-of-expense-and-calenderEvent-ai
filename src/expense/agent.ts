import { ChatGroq } from "@langchain/groq"
import { MemorySaver, MessagesAnnotation, StateGraph, type LangGraphRunnableConfig, } from "@langchain/langgraph"
import "dotenv/config";
import { ToolNode } from "@langchain/langgraph/prebuilt"
import type { AIMessage } from "langchain";
import { initTools } from "./tool.js";
import ConnectDB from "../db.js";


/**
 * inital the model 
 */

// Connect to database
ConnectDB().catch(console.error);

export function createAgent(userId: string) {
    const tools = initTools(userId)

    /**
     * model calling
    */

    const modelWithTools = new ChatGroq({
        apiKey: process.env.GROQ_API_KEY,
        model: "openai/gpt-oss-120b",
        temperature: 0,
    }).bindTools(tools)

    /**
     * tool node
    */

    const toolNode = new ToolNode(tools)


    /**
     * call the model with the state of MessagesAnnotation
    */

    async function callmodel(state: typeof MessagesAnnotation.State,): Promise<any> {

        const response: any = await modelWithTools.invoke([
            {
                role: "system",
                content: `You are a helpful personal assistant for expenses and calendar scheduling.
For expenses: the current datetime is ${new Date().toISOString()}; when the user provides a title and amount you MUST call the add_expense tool with those exact values and the userId to store the record, and when the user asks to view, list, or show expenses you MUST call the get_expenses tool with the userId and return the formatted results to the user and if user ask for grouping or chart the expenses by day, month, or year you MUST call the get_expenses_by_grouping tool with the userId and this tool proper way excute with those exact values to get the formatted results to the user.
For calendar: Parse natural language scheduling requests (e.g., 'next Tuesday at 2pm') into proper ISO datetime formats. Use get_available_time_slots to check availability when needed. Use create_calendar_event to schedule events. Always confirm what was scheduled in your final response.
The userId is ${userId}.`
            },
            ...state.messages
        ])

        // for await (const chunk of response.content) {
        //     writer?.({ status: "generating", progress: 50 });
        //     console.log(chunk);
        // }
        return {
            messages: [response]
        }
    }


    /**
     * the function to decide which node to go next after callmodel
    */

    async function shoudContinue(
        state: typeof MessagesAnnotation.State,
        config: LangGraphRunnableConfig
    ) {
        const lastMessage = state.messages.at(-1) as AIMessage;
        if (!lastMessage?.tool_calls?.length) return "__end__";

        const toolCall = lastMessage.tool_calls[0];


        if (toolCall?.name) {
            config.writer?.({
                type: "custom",
                data: { tool: toolCall.name, args: toolCall.args }
            });
        }
        return "tools";
    }

    /**
     * the graph
     */

    const workflow = new StateGraph(MessagesAnnotation)
        .addNode("agent", callmodel)
        .addNode("tools", toolNode)
        .addEdge("__start__", "agent")
        .addConditionalEdges("agent", shoudContinue)
        .addEdge("tools", "agent");

    const app = workflow.compile();

    return app;
}





