import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    _id: {type: String, required: true},
    name: {type: String, required: true},
    email: {type: String, required: true},
    image: {type: String, required: true},
    city: {type: String} // Add city field for user location
})

const User = mongoose.model('User', userSchema)

export default User;