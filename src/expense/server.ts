import readline from "readline/promises";
import { stdin as input, stdout as output } from "process";
import { User } from "../DatabaseSchema/index.js";
import { createSupervisorAgent } from "../tools/agentToolsCall.js";

const rl = readline.createInterface({ input, output });

async function login() {
    while (true) {
        const email = await rl.question("Enter your email: ");
        const user = await User.findOne({ email });
        if (user) {
            console.log(`Logged in as ${user.email}`);
            return user.id;
        } else {
            console.log("User not found. Try again.");
        }
    }
}

async function main() {
    const userId = await login();
    const agent = createSupervisorAgent(userId);

    while (true) {
        const question = await rl.question("You: ");

        if (question === "exit" || question === "bye") {
            console.log("Goodbye 👋");
            break;
        }

        try {
            const result = await agent.invoke({
                messages: [{ role: "user", content: question }, {
                    configurable: { thread_id: "expense_thread_1" }
                }]
            });
            const lastMessage = result.messages[result.messages.length - 1];
            console.log("Assistant:", lastMessage!.content);
        } catch (error) {
            console.error("Error:", error);
        }
    }

    rl.close();
}

main().catch(console.error);