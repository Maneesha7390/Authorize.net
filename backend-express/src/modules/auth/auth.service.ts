import { User, IUser, UserRole } from "./auth.model";
import { ApiError } from "../../utils/ApiError";
import { generateToken } from "../../utils/jwt.util";

export class AuthService {
    static async register(userData: Partial<IUser>) {
        const existedUser = await User.findOne({ email: userData.email });

        if (existedUser) {
            throw new ApiError(409, "User with this email already exists");
        }

        const user = await User.create(userData);

        const userWithoutPassword = await User.findById(user._id).select("-password");

        if (!userWithoutPassword) {
            throw new ApiError(500, "Something went wrong while registering user");
        }

        return userWithoutPassword;
    }

    static async login(email: string, password: string) {
        const user = await User.findOne({ email });

        if (!user) {
            throw new ApiError(404, "User does not exist");
        }

        const isPasswordValid = await user.isPasswordCorrect(password);

        if (!isPasswordValid) {
            throw new ApiError(401, "Invalid user credentials");
        }

        const token = generateToken({
            id: (user._id as any).toString(),
            role: user.role,
            email: user.email,
        });

        const loggedInUser = await User.findById(user._id).select("-password");

        return { user: loggedInUser, token };
    }
}
