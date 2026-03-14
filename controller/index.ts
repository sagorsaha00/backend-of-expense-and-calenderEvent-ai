

import type { UserSchema } from "../DatabaseSchema";
import { User } from "../DatabaseSchema";
import bcrypt from 'bcrypt'
import type { Request, Response } from 'express';

export class functionController {
    constructor() { }

    async saveGoogleUser(data: UserSchema) {

        try {
            console.log("data", data)
            let user = await User.findOne({ id: data.id });

            if (user) {
                console.log("User already exists:", user.email);
                return user;
            }
            user = new User({
                id: data.id,
                email: data.email,
                verifiedEmail: data.verifiedEmail,
                name: data.name,
                givenName: data.givenName,
                familyName: data.familyName,
                picture: data.picture,
            });

            await user.save();
            console.log("User saved successfully:", user.email);
            return user;
        } catch (err) {
            console.error("Error saving user:", err);
            throw err;
        }
    }
    async registerFuncUser(req: Request, res: Response) {
        try {

            const { firstname, lastname, email, password } = req.body;
            const hashedPassword = await bcrypt.hash(password, 10);
            let useremail = await User.findOne({ email: email });

            if (useremail) {
                return res.status(400).json({
                    message: "Email already used by another person"
                });
            }

            const user = new User({
                firstname: firstname,
                lastname: lastname,
                email: email,
                password: hashedPassword
            });

            await user.save();

            return res.status(201).json({
                message: "User registered successfully",
                user: user
            });

        } catch (error) {

            return res.status(500).json({
                message: "Server error",
                error
            });

        }
    }
}
