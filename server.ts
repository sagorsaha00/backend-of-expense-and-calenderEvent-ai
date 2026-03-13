import express, { Request, Response } from "express";
import cors from "cors";
import dotenv from "dotenv";
import { google } from "googleapis";
import axios from "axios";
import ConnectDB from "./db";
import User from "./DatabaseSchema";
import { saveGoogleUser } from "./controller";




dotenv.config();

const app = express();

app.use(
    cors({
        origin: "http://localhost:3001",
        credentials: true,
    })
);

app.use(express.json());

const oauth2Client = new google.auth.OAuth2(
    process.env.CLIENT_ID,
    process.env.CLIENT_SECRET,
    process.env.REDIRECT_URI
);

app.get('/', (req, res) => {
    res.json('ok')
})


app.get("/auth/google", (req: Request, res: Response) => {
    const url = oauth2Client.generateAuthUrl({
        access_type: "offline",
        scope: [
            "https://www.googleapis.com/auth/userinfo.profile",
            "https://www.googleapis.com/auth/userinfo.email",
        ],
    });

    res.redirect(url);
});


app.get("/api/callback/login/user", async (req: Request, res: Response) => {
    try {
        const code = req.query.code as string;

        if (!code) {
            return res.status(400).send("No code provided");
        }

        const { tokens } = await oauth2Client.getToken(code);
        oauth2Client.setCredentials(tokens);


        const userInfo = await axios.get(
            "https://www.googleapis.com/oauth2/v2/userinfo",
            {
                headers: {
                    Authorization: `Bearer ${tokens.access_token}`,
                },
            }
        );

        const user = userInfo.data;
        await saveGoogleUser(user)
        return
    } catch (error) {
        console.error(error);
        res.status(500).send("Google login failed");
    }
});

const PORT = 3001;

app.listen(PORT, async () => {
    await ConnectDB()
    console.log(`Server running on port ${PORT}`);
});