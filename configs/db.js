import mongoose from 'mongoose';

const connectDB = async () =>{
    try {
        mongoose.connection.on('connected', ()=> {});
        await mongoose.connect(`${process.env.MONGO_URI}/Popcorn`)
    } catch (error) {
        
    }
}

export default connectDB;