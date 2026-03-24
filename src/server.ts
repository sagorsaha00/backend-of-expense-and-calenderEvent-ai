import dotenv from "dotenv";
import express from "express";
import type { Request, Response } from "express";
import cors from "cors";
import { google } from "googleapis";
import axios from "axios";
import { Command } from "@langchain/langgraph";
import type { HITLRequest, HITLResponse, Interrupt } from "langchain";
import ConnectDB from "./db.js";
import authroute, { userController } from './router/user.js'
import { HumanMessage } from "@langchain/core/messages";
import { createSupervisorAgent } from "./expense/agentToolsCall.js";
import { saveUserTokens } from "./store/tokenStore.js";
import type { UserSchema } from "./DatabaseSchema/index.js";
import tokenroute from './router/token.js'
dotenv.config();

const app = express();

const corsOptions = {
    origin: ["http://localhost:5173", "https://expense-tracker-client-server.vercel.app"],
    methods: ["GET", "POST"],
    allowedHeaders: ["Content-Type", "Authorization", "Cache-Control", "Accept"],
    exposedHeaders: ["Content-Type"],
    credentials: true,
    optionsSuccessStatus: 200,
};
app.use(cors(corsOptions))
app.use(express.json());

// ─── Single shared OAuth2 client (credentials set after login) ───────────────
const oauth2Client = new google.auth.OAuth2(
    process.env.CLIENT_ID,
    process.env.CLIENT_SECRET,
    process.env.REDIRECT_URI
);


app.get('/dashboard', (req, res) => {
    res.json('ok');
});
app.use('/auth', authroute)
app.use('/token', tokenroute)

app.get("/auth/google", (req: Request, res: Response) => {
    const url = oauth2Client.generateAuthUrl({
        access_type: "offline",
        prompt: "consent",
        scope: [
            "https://www.googleapis.com/auth/userinfo.profile",
            "https://www.googleapis.com/auth/userinfo.email",
            "https://www.googleapis.com/auth/calendar"
        ],
    });
    res.redirect(url);
});

app.get("/api/callback/login/user", async (req: Request, res: Response) => {
    try {
        const code = req.query.code as string;
        if (!code) return res.status(400).send("No code provided");
        const tempClient = new google.auth.OAuth2(
            process.env.CLIENT_ID,
            process.env.CLIENT_SECRET,
            process.env.REDIRECT_URI
        );

        const { tokens } = await tempClient.getToken(code);
        if (!tokens.access_token) {
            return res.status(500).send("No access token returned from Google");
        }

        tempClient.setCredentials(tokens);

        const userInfo = await axios.get(
            "https://www.googleapis.com/oauth2/v2/userinfo",
            { headers: { Authorization: `Bearer ${tokens.access_token}` } }
        );

        const user = {
            ...userInfo.data,
            access_token: tokens.access_token,
            refresh_token: tokens.refresh_token ?? null,
            token_expiry: tokens.expiry_date ?? null,
        };

        const result: UserSchema = await userController.saveGoogleUser(user) as UserSchema;


        const id = result?.id;

        if (!id) {
            console.error("User ID not found in result:", result);
            return res.status(500).send("User saved but ID not found");
        }
        console.log("id", id)
        saveUserTokens(id, {
            access_token: tokens.access_token,
            refresh_token: tokens.refresh_token,
            token_expiry: (tokens.expiry_date as any) ?? null,
        });


        res.send(`
            <script>
                window.opener.postMessage(
                    ${JSON.stringify(result,)},
                    'https://expense-tracker-client-server.vercel.app'
                );
                window.close();
            </script>
        `);
    } catch (error) {
        console.error(error);
        res.status(500).send("Google login failed");
    }
});
app.post("/chat/stream", async (req, res) => {
    try {
        const { userId, message } = req.body;

        if (!userId || !message) {
            return res.status(400).json({ error: "userId and message are required" });
        }

        res.setHeader("Content-Type", "text/event-stream");
        res.setHeader("Cache-Control", "no-cache");
        res.setHeader("Connection", "keep-alive");

        const agent = createSupervisorAgent(userId);
        const threadId = `expense_thread_${userId}`;
        const config = { configurable: { thread_id: threadId } };

        const streamAndAutoApprove = async (input: any) => {
            const stream = await agent.stream(input, {
                ...config,
                streamMode: "messages",
            })

            for await (const chunk of stream) {
                const anyCunk = chunk as any
                if (anyCunk?.__interrupt__) {
                    const interruptData = anyCunk.__interrupt__[0] as Interrupt<HITLRequest>;
                    const actionRequests = interruptData.value.actionRequests;

                    const resume: HITLResponse = {
                        decisions: actionRequests.map(() => ({ type: "approve" })),
                    };

                    await streamAndAutoApprove(new Command({ resume }));
                    return;
                }
                const [msg] = chunk;
                if (msg?.content && typeof msg.content === "string") {
                    res.write(`data: ${JSON.stringify({ token: msg.content })}\n\n`);
                }
            }
        };

        await streamAndAutoApprove({ messages: [new HumanMessage(message)] });

        res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
        res.end();

    } catch (error) {
        console.error("Stream error:", error);
        res.write(`data: ${JSON.stringify({ error: "Something went wrong" })}\n\n`);
        res.end();
    }
});
const PORT = 3001;
app.listen(PORT, async () => {
    await ConnectDB();
    console.log(`Server running on port ${PORT}`);
});