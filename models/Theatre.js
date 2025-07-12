import mongoose from "mongoose";

const theatreSchema = new mongoose.Schema({
  name: { type: String, required: true },
  city: { type: String, required: true },
  admin: { type: String, ref: "User", required: true }, // Clerk/Mongo user id
  layout: { type: [[Number]], default: [[1,1,1,1,1],[1,1,1,1,1],[1,1,1,1,1]] }
});

const Theatre = mongoose.model("Theatre", theatreSchema);
export default Theatre; 