import mongoose from "mongoose";

const theatreSchema = new mongoose.Schema({
  name: { type: String, required: true },
  city: { type: String, required: true },
  admin: { type: String, ref: "User", required: true }, // Clerk/Mongo user id
  layout: { type: [[Number]], default: Array(8).fill().map(() => Array(10).fill(1)) },
  rooms: [
    {
      name: { type: String, required: true },
      type: { type: String, required: true },
      layout: { type: [[Number]], required: true }
    }
  ]
});

const Theatre = mongoose.model("Theatre", theatreSchema);
export default Theatre; 