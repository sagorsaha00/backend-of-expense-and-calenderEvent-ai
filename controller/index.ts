import User from "../DatabaseSchema";
import type { UserSchema } from "../DatabaseSchema";
export async function saveGoogleUser(data: UserSchema) {
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