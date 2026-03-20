
import { Schema, model, Document } from "mongoose";

export interface IRefreshToken extends Document {
    userid: string 
    email: string;
    token: string;
    expiresAt: Date;
    createdAt: Date;
    userAgent?: string;
    ipAddress?: string;
}

const refreshTokenSchema = new Schema<IRefreshToken>({
    userid: {
        type: String,
        required: true,
        ref: "users",
    },
    email: {
        type: String,
        required: true,
    },

    expiresAt: {
        type: Date,
        required: true,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
    userAgent: {
        type: String,
    },
    ipAddress: {
        type: String,
    },
});


refreshTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const RefreshTokenSchema = model<IRefreshToken>(
    "RefreshToken",
    refreshTokenSchema
);
