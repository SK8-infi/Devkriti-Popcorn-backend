import mongoose from "mongoose";

const theatreSchema = new mongoose.Schema({
  name: { type: String, required: true },
  city: { type: String, required: true },
  layout: { type: [[Number]], default: [[1,1,1,1,1],[1,1,1,1,1],[1,1,1,1,1]] }
});

const Theatre = mongoose.model("Theatre", theatreSchema);
export default Theatre; 