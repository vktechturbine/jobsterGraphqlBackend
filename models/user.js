import mongoose from 'mongoose';

const Schema = mongoose.Schema;

const userSchema = new Schema({
    email: {
        type: String,
        required: true
    },
    password: {
        type: String,
        required: true
    },
    name: {
        type: String,
        required: true
    },
    lastName: {
        type: String,
        default: "lastname"
    },
    location: {
        type: String,
        default: "my city"
    },
    jobs: [{
        type: Schema.Types.ObjectId,
        ref: 'Jobs'
    }],
    applyjobs: [{
        jobId: {
            type: Schema.Types.ObjectId,
            ref: 'Jobs'
        },
        status: {
            type: String,
            default:'Pending'
        }
    }],
})

export default mongoose.model('User', userSchema);