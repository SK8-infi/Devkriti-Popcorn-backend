import mongoose from "mongoose";

const showSchema = new mongoose.Schema(
    {
        movie: {type: String, required: true, ref: 'Movie'},
        theatre: {type: mongoose.Schema.Types.ObjectId, required: true, ref: 'Theatre'},
        showDateTime: { type: Date, required: true },
        showPrice: { type: Number, required: true },
        occupiedSeats: { type: Object, default:{} },
        room: { type: String, required: true } // room._id from Theatre.rooms
    }, { minimize: false}
)

const Show = mongoose.model("Show", showSchema);

export default Show;