// ─── models/user.ts ──────────────────────────────────────────────────────────
import { model, Schema, Document } from "mongoose";

interface IUser extends Document {
    name: string;
    email: string;
    picture?: string;
    google_id: string;
    access_token: string;
    refresh_token: string;
    token_expiry: number;
}

const userSchema = new Schema<IUser>({
    name: String,
    email: String,
    picture: String,
    google_id: String,
    access_token: String,
    refresh_token: String,
    token_expiry: Number,
}, { timestamps: true });

const UserModel = model<IUser>("User", userSchema);

export default UserModel;