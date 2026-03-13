import mongoose, { Schema, Document } from "mongoose";

export interface UserSchema extends Document {
    id: string;
    email: string;
    verifiedEmail: boolean;
    name: string;
    givenName: string;
    familyName: string;
    picture: string;
    createdAt: Date;
    updatedAt: Date;
}

const UserData: Schema<UserSchema> = new Schema(
    {
        id: { type: String, required: true, unique: true },
        email: { type: String, required: true, unique: true },
        verifiedEmail: { type: Boolean, default: false },
        name: { type: String, required: true },
        givenName: { type: String },
        familyName: { type: String },
        picture: { type: String },
    },
    {
        timestamps: true,
    }
);

const User = mongoose.model<UserSchema>("User", UserData);
export default User;