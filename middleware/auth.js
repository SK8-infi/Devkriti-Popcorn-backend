import { clerkClient } from "@clerk/express";
import User from "../models/User.js";

export const protectAdmin = async (req, res, next)=>{
    try {
        const { userId } = req.auth();

        const user = await clerkClient.users.getUser(userId)

        if(user.privateMetadata.role !== 'admin'){
            return res.json({success: false, message: "not authorized"})
        }

        // Fetch from MongoDB and attach to req
        let dbUser = await User.findById(userId);
        if (!dbUser) {
            // Create the user in MongoDB
            dbUser = await User.create({
                _id: user.id,
                name: user.firstName + (user.lastName ? ' ' + user.lastName : ''),
                email: user.emailAddresses[0]?.emailAddress || '',
                image: user.imageUrl || ''
            });
        }
        req.user = dbUser;
        next();
    } catch (error) {
        return res.json({ success: false, message: "not authorized" });
    }
}