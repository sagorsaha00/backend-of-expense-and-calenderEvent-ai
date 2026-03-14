import mongoose, { Schema, Document } from "mongoose";

export interface UserSchema extends Document {
    id: string;
    firstname?: string;
    lastname?: string;
    email: string;
    password?: string;
    verifiedEmail?: boolean;
    name?: string;
    givenName?: string;
    familyName?: string;
    picture?: string;
    createdAt: Date;
    updatedAt: Date;
}

const UserSchemaModel: Schema = new Schema(
    {
        id: { type: String, unique: true, sparse: true },
        firstname: { type: String },
        lastname: { type: String },
        email: { type: String, required: true, unique: true },
        password: { type: String },
        verifiedEmail: { type: Boolean, default: false },
        name: { type: String },
        givenName: { type: String },
        familyName: { type: String },
        picture: { type: String },
    },
    {
        timestamps: true,
    }
);

const User = mongoose.model<UserSchema>("users", UserSchemaModel);

export { User };