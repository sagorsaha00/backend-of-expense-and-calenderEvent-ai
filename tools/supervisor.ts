import readline from "readline/promises";
import { stdin as input, stdout as output } from "process";

import { HumanMessage } from "@langchain/core/messages";
import { Command } from "@langchain/langgraph";
import type { HITLRequest, HITLResponse, Interrupt } from "langchain";
import { supervisorAgent } from "./agentToolsCall";

const rl = readline.createInterface({ input, output });

const config = {
    configurable: {
        thread_id: "calendar-thread",
    },
};

async function start() {
    while (true) {
        const question = await rl.question("You: ");

        if (question === "exit" || question === "bye") {
            console.log("Goodbye 👋");
            break;
        }

        const result = await supervisorAgent.invoke(
            { messages: [new HumanMessage(question)] },
            config
        );

        // Handle human-in-the-loop interrupt
        if (result.__interrupt__) {
            const interruptData = result.__interrupt__[0] as Interrupt<HITLRequest>;
            const actionRequests = interruptData.value.actionRequests;

            console.log("\n⚠️  Tool execution requires approval");
            console.log("Pending tool:", actionRequests.map((a) => a.name).join(", "));
            console.log("Arguments:", JSON.stringify(actionRequests[0]?.args, null, 2));

            const decision = await rl.question("Approve tool execution? (yes/no): ");

            const resume: HITLResponse = {
                decisions: actionRequests.map(() =>
                    decision.toLowerCase() === "yes"
                        ? { type: "approve" }
                        : { type: "reject", message: "Rejected by user" }
                ),
            };

            const resumed = await supervisorAgent.invoke(
                new Command({ resume }),
                config
            );
            console.log("resumed", resumed)
            const lastMessage =
                resumed.messages?.[resumed.messages.length - 1]?.content;
            console.log("Assistant:", lastMessage);
        } else {
            const lastMessage =
                result.messages?.[result.messages.length - 1]?.content;
            console.log("Assistant:", lastMessage);
        }
    }

    rl.close();
}

start();