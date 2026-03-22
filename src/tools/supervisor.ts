
import readline from "readline/promises";
import { stdin as input, stdout as output } from "process";
import { User } from "../DatabaseSchema/index.js";

import { HumanMessage } from "@langchain/core/messages";
import { Command } from "@langchain/langgraph";
import type { HITLRequest, HITLResponse, Interrupt } from "langchain";
import { createSupervisorAgent } from "../expense/agentToolsCall.js";


const rl = readline.createInterface({ input, output });

async function login() {
    while (true) {
        const email = await rl.question("Enter your email: ");
        const user = await User.findOne({ email });
        console.log("user", user)
        if (user) {
            console.log(`Logged in as ${user.email}`);
            return user.id;
        } else {
            console.log("User not found. Try again.");
        }
    }
}

async function start() {
    const userId = await login();
    const supervisorAgent = createSupervisorAgent(userId);

    const config = {
        configurable: {
            thread_id: "calendar-thread",
        },
    };

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