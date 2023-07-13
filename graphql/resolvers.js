import validator from "validator";
import jwt from 'jsonwebtoken';
import User from '../models/user.js';
import Job from '../models/jobs.js'
import bcrypt from 'bcryptjs';
import { Query } from "mongoose";
import ObjectID from 'mongodb';
const ObjectIDD = ObjectID.ObjectId;
export const resolvers = {

    Mutation: {
        createUser: async function (parent, { userInput }, contextValue, info) {

            if (!validator.isEmail(userInput.email)) {
                errors.push({ message: "please enter a valid email" });
            }
            if (validator.isEmpty(userInput.password) || !validator.isLength(userInput.password, { min: 5 })) {
                errors.push({ message: "please enter a valid password" });
            }

            const existingUser = await User.findOne({ email: userInput.email });

            //check user is already register or not
            if (existingUser) {
                const error = new Error("user is Already Exists");
                throw error;
            }

            // conver user password into hash using bcryptjs library
            const hashpw = await bcrypt.hash(userInput.password, 12)

            const user = new User({
                email: userInput.email,
                name: userInput.name,
                password: hashpw,
                jobs: [],
                applyjobs: []
            })
            const createdUser = await user.save();
            console.log(createdUser)
            const isEqual = await bcrypt.compare(userInput.password, createdUser.password);
            if (!isEqual) {
                const error = new Error("Password is InCorrect");
                error.code = 422;
                throw error;
            }
            const token = jwt.sign({
                userId: user._id.toString(),
                email: user.email,
            }, 'somesupersecretsecret', { expiresIn: '1h' });

            return { ...createdUser._doc, token: token, userId: createdUser._id.toString(), email: createdUser.email, lastName: createdUser.lastName, location: createdUser.location, name: createdUser.name };


        },
        updateuserProfiile: async function (parent, { userInput }, context, info) {

            if (!context.isAuth) {
                const error = new Error("Not Authorized");
            }
            const user = await User.findById(context.user.userId);

            user.email = userInput.email;
            user.name = userInput.name;
            user.location = userInput.location;
            user.lastName = userInput.lastName;

            const token = jwt.sign({
                userId: context.user.userId.toString(),
                email: userInput.email,
            }, 'somesupersecretsecret', { expiresIn: '1h' });


            const updateUser = await user.save();

            return { email: updateUser.email, token: token, name: updateUser.name, location: updateUser.location, lastName: updateUser.lastName, userId: updateUser._id.toString() };
        },
        createJob: async function (parent, { jobInput }, context, info) {
            console.log(jobInput);

            const user = await User.findById('64ab8fb6d8fcdecf17085c8b');

            const job = new Job({
                position: jobInput.position,
                company: jobInput.company,
                jobLocation: jobInput.jobLocation,
                jobType: jobInput.jobType,
                status: jobInput.status,
                createdBy: user._id,
                applyJobs: []
            })

            const addJob = await job.save();

            console.log(addJob);
            return { ...addJob._doc };
        },
        updateJobRequest: async function (parent, { updateJobInput, jobId }, context, info) {
            console.log(updateJobInput);
            console.log(jobId);
            const position = updateJobInput.position;
            const company = updateJobInput.company;
            const jobLocation = updateJobInput.jobLocation;
            const jobType = updateJobInput.jobType;
            const status = updateJobInput.status;
            console.log(context);
            if (!context.isAuth) {
                const error = new Error('Your Dont have permission to update this job');
                error.code = 422;
                throw error;
        
            }
            
            console.log("Hello")
            const job = await Job.find({_id:jobId,createdBy:context.user.userId})


            const newJobFind = await Job.updateOne({_id:job[0]._id},{$set:{company:company,position:position,jobLocation:jobLocation,jobType:jobType,status:status}});
            console.log(newJobFind);
            
            return {message:"Job updated successfully"}; 
             /* .then(job => {
                 */
            
        },
        aplyjobRequest: async function (parent, { requestInput }, context, info) {
            console.log(requestInput);

            if (!context.isAuth) {
                const error = new Error("Not Authorized");
            }

            const jobId = requestInput.jobId;
            const jobOwner = requestInput.jobOwner;
            const candidate = context.user.userId;



            const job = await Job.findById(jobId);
            const checkApply_status = job.applyJobs.find(job => job.toString() === candidate.toString());

            if (checkApply_status) {
                return { message: 'You already apply this job' };
            }

            await Job.updateOne(
                { _id: new ObjectIDD(jobId) },
                { $addToSet: { applyJobs: new ObjectIDD(candidate) } }
            );

            await User.updateOne(
                { _id: new ObjectIDD(candidate) },
                { $addToSet: { applyjobs: { jobId: new ObjectIDD(jobId) } } }
            );

            return { message: 'You successfully apply this job' };
        },
        applicationRequest: async function (parent, { applicationRequestInput }, context, info) {
            console.log(applicationRequestInput);
            const user = await User.findOneAndUpdate({ _id: applicationRequestInput.userId, applyjobs: { $elemMatch: { jobId: applicationRequestInput.jobId } } }, { $set: { "applyjobs.$.status": applicationRequestInput.selectionRequestId } }, { new: true });
            if (user) {
                if (applicationRequestInput.selectionRequestId == 'Selected') {
                    return { message: 'Selected' };
                }
                if (applicationRequestInput.selectionRequestId == 'Rejected') {
                    return { message: 'Rejected' };
                }
            }
        },
        deleteJobRequest: async function (parent, { deleteJobInput }, context, info) {
            if (!context.isAuth) {
                const error = new Error("Not Authorized");
                error.code = 422;
                throw error;
            }
            const user = await User.updateMany({}, { $pull: { applyjobs: { jobId: deleteJobInput.jobId } } });
            const job = await Job.deleteOne({ _id: deleteJobInput.jobId });

            if (user || job) {
                return { message: "Job deleted successfully" };
            }
        }
    },
    Query: {
        login: async function (_, { email, password }, context, info) {
            console.log('info_____________________________________');

            const user = await (User.findOne({ email: email }));
            console.log(user);
            if (!user) {
                const error = new Error("User not Found");
                error.code = 401;
                throw error;
            }
            const isEqual = await bcrypt.compare(password, user.password);

            if (!isEqual) {
                const error = new Error("Password is InCorrect");
                error.code = 422;
                throw error;
            }
            const token = jwt.sign({
                userId: user._id.toString(),
                email: user.email,
            }, 'somesupersecretsecret', { expiresIn: '2h' });

            return { token: token, userId: user._id.toString(), email: user.email, lastName: user.lastName, location: user.location, name: user.name };
        },
        jobs: async function (_, { searchJobInput }, context, info) {
            console.log(searchJobInput);
            console.log(context);

            const page = searchJobInput.page;
            const search = searchJobInput.search;
            const jobType = searchJobInput.type;
            const status = searchJobInput.status;
            const sort = searchJobInput.sort;

            const perPage = 10;

            let query = { createdBy: { $eq: context.user.userId } };

            if (search) {
                query.position = { $regex: `^.*${search}.*$`, $options: 'i' };
            }
            if (status && status !== 'all') {
                query.status = status;
            }
            if (jobType && jobType !== 'all') {
                query.jobType = jobType;
            }
            if (status === 'all' && jobType === 'all') {
                delete query.status;
                delete query.jobtype;
            }
            let sortOption = {};

            if (sort === 'latest') {

                sortOption.createdAt = 'desc';
            }
            if (sort === 'oldest') {

                sortOption.createdAt = 'asc';
            }
            if (sort === 'a-z') {

                sortOption.position = 'asc';

            }
            if (sort === 'z-a') {

                sortOption.position = 'desc';
            }
            if (!context.isAuth) {
                const error = new Error('Not Authenticate');
                error.code = 401;
                throw error;
            }

            const job = await Job.find(query).sort(sortOption).skip((page - 1) * perPage).limit(perPage);
            const totalnumofJobs = await Job.find(query).populate('createdBy').sort(sortOption).countDocuments();
            const numofJobs = totalnumofJobs < perPage ? 1 : Math.ceil(totalnumofJobs / perPage);

            return {
                jobs: job.map(jobs => {
                    return { _id: jobs._id.toString(), company: jobs.company, position: jobs.position, jobLocation: jobs.jobLocation, jobType: jobs.jobType, status: jobs.status, createdBy: jobs.createdBy, createdAt: jobs.createdAt.toISOString(), updatedAt: jobs.updatedAt.toISOString() };
                }), totalJobs: totalnumofJobs, numbofJobs: numofJobs
            };
        },
        stats: async function (_, args, context, info) {

            if (!context.isAuth) {
                const error = new Error('Not Authenticate');
                error.code = 401;
                throw error;
            }

            const jobInterviewCount = await Job.find({ createdBy: context.user.userId, status: { $eq: 'interview' } }).countDocuments() || 0;
            const jobDeclinedCount = await Job.find({ createdBy: context.user.userId, status: { $eq: 'declined' } }).countDocuments() || 0;
            const jobPendingCount = await Job.find({ createdBy: context.user.userId, status: { $eq: 'pending' } }).countDocuments() || 0;

            const jobsDate = await Job.aggregate([
                {
                    $match: { createdBy: new ObjectIDD(context.user.userId) }

                },

                {

                    $group: {
                        _id: {
                            month: { $month: "$createdAt" },
                            year: { $year: "$createdAt" }
                        },
                        total: { $sum: 1 },
                    },
                },
                {
                    $project: {
                        month: '$_id.month',
                        year: ('$_id.year').toString(),
                        total: 1,
                        _id: 0,
                    },


                },
                {
                    $addFields: {
                        month: {
                            $let: {
                                vars: {
                                    monthsInString: [, 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'july', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
                                },
                                in: {
                                    $arrayElemAt: ['$$monthsInString', '$month']
                                }
                            }
                        }
                    }
                }

            ]);



            console.log(jobInterviewCount);
            console.log(jobDeclinedCount);
            console.log(jobPendingCount);

            return {
                defaultStats: { interview: jobInterviewCount, declined: jobDeclinedCount, pending: jobPendingCount }, monthlyApplications: jobsDate.map(r => {
                    return { date: r.month + " " + r.year, count: r.total };
                })
            }
        },
        seekingJob: async function (_, args, context, info) {
            /*  
             if (!context.isAuth) {
                 const error = new Error('Not Authenticate');
                 error.code = 401;
                 throw error;
             }  */

            const job = await Job.find({ createdBy: { $ne: context.user.userId } });
            return {
                jobs: job.map(jobs => {
                    return { _id: jobs._id.toString(), company: jobs.company, position: jobs.position, jobLocation: jobs.jobLocation, jobType: jobs.jobType, status: jobs.status, createdBy: jobs.createdBy, createdAt: jobs.createdAt.toISOString(), updatedAt: jobs.updatedAt.toISOString() };
                    // return {_id:jobs._id.toString(),createdBy:jobs.createdBy.toString(),createdAt:jobs.createdAt.toISOString(),updatedAt:jobs.updatedAt.toISOString()};
                })
            }
        },

        appliedJobs: async function (_, args, context, info) {

            const user = await User.findById(context.user.userId).populate('applyjobs.jobId');
            console.log(context);

            // const job = await Job.find({applyJobs:{ $in: context.user.userId}});

            return {
                userAppliedJobs: user.applyjobs.map(jobs => {
                    return { position: jobs.jobId.position, company: jobs.jobId.company, location: jobs.jobId.jobLocation, jobType: jobs.jobId.jobType, jobStatus: jobs.status }
                })
            }

        },
        showAnotheruserApplication: async function (_, args, context, info) {
            const job = await Job.aggregate([
                { $match: { createdBy: new ObjectIDD(context.user.userId) } },
                { $lookup: { from: 'users', localField: 'applyJobs', foreignField: '_id', as: 'users' } },
                { $unwind: '$users' },
                {
                    $project: {
                        userId: '$users._id',
                        userName: '$users.name',
                        userEmail: '$users.email',
                        userLocation: '$users.location',
                        jobId: '$_id',
                        jobPosition: '$position',
                        jobLocation: '$jobLocation',
                        jobStatus: '$status',
                        applyjobs: {
                            $let: {
                                vars: { valueToCompare: '$_id' }, // Replace 'projectField' with the actual field from which you want to extract the value
                                in: {
                                    $filter: {
                                        input: '$users.applyjobs',
                                        as: 'applyjob',
                                        cond: {
                                            $eq: ['$$applyjob.jobId', '$$valueToCompare']
                                        }
                                    }
                                }
                            }
                        }
                    }

                }
            ]);

            return {
                applicationOtherUser: job.map(jobs => {
                    return { _id: jobs._id.toString(), userId: jobs.userId.toString(), userName: jobs.userName, userEmail: jobs.userEmail, userLocation: jobs.userLocation, jobId: jobs.jobId.toString(), jobPosition: jobs.jobPosition, jobLocation: jobs.jobLocation, jobStatus: jobs.applyjobs[0].status }
                })
            }
        }
    }

}