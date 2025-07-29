import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    image: { type: String },
    city: { type: String },
    theatre: { type: String },
    googleId: { type: String, sparse: true },
    role: { type: String, enum: ['user', 'admin'], default: 'user' },
    isVerified: { type: Boolean, default: false },
    favorites: [{ type: String }]
}, { timestamps: true });

const User = mongoose.model('User', userSchema);

export default User;