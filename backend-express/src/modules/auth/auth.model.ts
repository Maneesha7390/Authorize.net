import mongoose, { Schema, Document, Model, HydratedDocument } from "mongoose";
import bcrypt from "bcrypt";

export enum UserRole {
    ADMIN = "admin",
    USER = "user",
}

export interface IUser {
    email: string;
    password: string;
    role: UserRole;
    isActive: boolean;
}

export interface IUserMethods {
    isPasswordCorrect(password: string): Promise<boolean>;
}

type UserModel = Model<IUser, {}, IUserMethods>;

const userSchema = new Schema<IUser, UserModel, IUserMethods>(
    {
        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
        },
        password: {
            type: String,
            required: [true, "Password is required"],
        },
        role: {
            type: String,
            enum: Object.values(UserRole),
            default: UserRole.USER,
        },
        isActive: {
            type: Boolean,
            default: true,
        },
    },
    {
        timestamps: true,
    }
);

userSchema.pre("save", async function () {
    const user = this as HydratedDocument<IUser, IUserMethods>;
    if (!user.isModified("password")) return;

    try {
        user.password = await bcrypt.hash(user.password, 10);
    } catch (error: any) {
        throw error;
    }
});

userSchema.methods.isPasswordCorrect = async function (password: string) {
    return await bcrypt.compare(password, this.password);
};

export const User = mongoose.model<IUser, UserModel>("User", userSchema);
export type IUserDocument = HydratedDocument<IUser, IUserMethods>;
