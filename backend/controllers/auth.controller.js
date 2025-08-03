import User from "../models/user.model.js";
import jwt from "jsonwebtoken";
import { redis } from "../lib/redis.js";

//Implementing the logic of generating tokens for authentication
const generateTokens = (userId) => {
    const accessToken = jwt.sign({ userId }, process.env.ACCESS_TOKEN_SECRET, {
        expiresIn: "15m",
    });
    const refreshToken = jwt.sign({ userId }, process.env.REFRESH_TOKEN_SECRET, {
        expiresIn: "30d",
    });
    return {
        accessToken,
        refreshToken,
    };
};

//Saving referesh tokens into redis database
const storeRefreshToken = async (userId, refreshToken) => {
    await redis.set(
        `refresh_token : ${userId}`,
        refreshToken,
        "EX",
        30 * 24 * 60 * 60
    );
};

//Setting the cookie
const setCookie = (res, accessToken, refreshToken) => {
    res.cookie("accessToken", accessToken, {
        httpOnly: true, //preventing the attack called XSS  cross site scripting attach which means you cannot access cookies from client using javascript

        secure: process.env.NODE_ENV === "production",
        sameSite: "strict", //prevents CSRF cross site request forgery
        maxAge: 15 * 60 * 1000,
    });

    res.cookie("refreshToken", refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 7 * 24 * 60 * 60 * 1000,
    });
};

//~ Signup logic
export const signup = async (req, res) => {
    try {
        //! user will enter/give up the details
        const { email, password, name } = req.body;

        const userExists = await User.findOne({ email });

        if (userExists) {
            return res.status(400).json({
                message: "User already exists",
            });
        }

        //? if not exist then create one
        const user = await User.create({ name, email, password }); //*the password will first hashed before saving it to the database which is defined in auth.model.js (pre-save hook)

        //! Authentication using access and refresh token
        const { accessToken, refreshToken } = generateTokens(user._id);
        await storeRefreshToken(user._id, refreshToken);

        //! setting the cookie
        setCookie(res, accessToken, refreshToken);

        res.status(201).json({
            user: {
                _id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
            },
            message: "User created successfully",
        });
    } catch (error) {
        console.log("Error in signup controller", error);
    }
};

export const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });

        if (!user) {
            return res
                .status(404)
                .json({ message: "User not found please signup first" });
        }

        if (user && (await user.comparePassword(password))) {
            const { accessToken, refreshToken } = generateTokens(user._id);
            await storeRefreshToken(user._id, refreshToken);
            setCookie(res, accessToken, refreshToken);
        }

        res.json({
            _id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
        });
    } catch (error) {
        console.log("Error in login controller");
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

export const logout = async (req, res) => {
    try {
        const refreshToken = req.cookies.refreshToken;

        if (refreshToken) {
            const decoded = jwt.verify(
                refreshToken,
                process.env.REFRESH_TOKEN_SECRET
            );

            await redis.del(`refresh_token : ${decoded.userId}`);
        }

        res.clearCookie("accessToken");
        res.clearCookie("refreshToken");

        res.status(200).json({ message: "User logged out successfully" });
    } catch (error) {
        console.log("Error in logout controller", error);
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

//? This will refresh the access token
export const refreshToken = async (req, res) => {
    try {
        const refreshToken = req.cookies.refreshToken;

        if (!refreshToken) {
            return res
                .status(401)
                .json({ message: "Unauthorized no refresh token found" });
        }

        const decode = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);

        const storedToken = await redis.get(`refresh_token : ${decode.userId}`);

        if (storedToken !== refreshToken) {
            return res
                .status(401)
                .json({ message: "Unauthorized invalid refresh token" });
        }

        //Generating new access token
        const accessToken = jwt.sign(
            { userId: decode.userId },
            process.env.ACCESS_TOKEN_SECRET,
            { expiresIn: "15m" }
        );

        res.cookie("accessToken", accessToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "strict",
            maxAge: 7*24*60*60*1000,
        });

        res.status(200).json({ message: "Token refreshed successfully" });

    } catch (error) {
        console.log("Error in refresh token controller", error);
        res.status(500).json({ message: "Server error", error: error.message });
    }
};


// export const getProfile=