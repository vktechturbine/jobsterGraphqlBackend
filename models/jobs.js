import mongoose from 'mongoose';

const Schema = mongoose.Schema;

export const jobSchema = new Schema({
    position:{
        type:String,
        required:true
    },
    company:{
        type:String,
        required:true
    },
    jobLocation:{
        type:String,
        default:"my city"
    },
    status:{
        type:String,
        default:"pending",
        
    },
    jobType:{
        type:String,
        default:"full-time"
    },
    createdBy:{
        type:Schema.Types.ObjectId,
        ref:'User',
        required:true
    },
    applyJobs:[{
        type:Schema.Types.ObjectId,
        ref:'User'
    }]
},{timestamps:true});

export default mongoose.model('Jobs',jobSchema);

