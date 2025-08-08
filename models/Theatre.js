import mongoose from "mongoose";

const theatreSchema = new mongoose.Schema({
  name: { type: String, required: true },
  city: { type: String, required: true },
  address: { type: String }, // Theatre's physical address
  admin: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }, // MongoDB user id
  layout: { type: [[Number]], default: Array(8).fill().map(() => Array(10).fill(1)) },
  rooms: [
    {
      name: { type: String, required: true },
      type: { type: String, required: true },
      layout: { type: [[Number]], required: true }
    }
  ],
  averageRating: { type: Number, default: 0 },
  reviewCount: { type: Number, default: 0 }
});

const Theatre = mongoose.model("Theatre", theatreSchema);
export default Theatre; 