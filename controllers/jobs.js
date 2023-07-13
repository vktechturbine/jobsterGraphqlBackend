const validator = require('validator');
const User = require('../models/user');
const Job = require('../models/jobs');
const moment = require('moment');
const mongoose = require('mongoose');
const ObjectID = require('mongodb').ObjectId;

exports.createJob = (request, response, next) => {
    console.log(request);

    const position = request.body.position;
    const company = request.body.company;
    const jobLocation = request.body.jobLocation;
    const jobType = request.body.jobType;
    const status = request.body.status;


    if (!request.isAuth) {
        const error = new Error('Not Authenticated');
        error.code = 401;
        response.status
    }



    if (validator.isEmpty(position) && validator.isEmpty(company) && validator.isEmpty(jobLocation)) {
        const error = new Error("Pleased fill Out All Fields");
        error.code = 401;
        response.status(error.code).json({ message: error.message });
        throw error;
    }
    console.log('Hello World')

    const job = new Job({
        position: position,
        company: company,
        jobLocation: jobLocation,
        status: status,
        jobType: jobType,
        createdBy: request.userId,
        applyJobs: []
    })
    let current_job;
    job.save().then(result => {
        current_job = result;
        return User.findOne({ _id: request.userId });
    }).then(user => {
        user.jobs.push(job);
        user.save();
        response.status(200).json({ job: current_job });
    }).catch(error => {
        error.code = 422;
        throw error;
    })

}

exports.getAllJob = (request, response, next) => {
    const search = request.query.search;
    const status = request.query.status;
    const jobType = request.query.jobType;
    let sorrt = request.query.sort;
    const page = request.query.page || 1;



    const perPage = 10;

    let query = { createdBy: { $eq: request.userId } };

    if (!request.isAuth) {
        const error = new Error('Not Authenticated');
        error.code = 422;
        throw error;
    }

    if (search) {
        query.position = { $regex: `^.*${search}.*$`, $options: 'i' };
    }
    if (status && status !== 'all') {
        query.status = status;
    }

    // Check if jobType is provided and not 'all'
    if (jobType && jobType !== 'all') {
        query.jobType = jobType;
    }
    if (status === 'all' && jobType === 'all') {
        delete query.status;
        delete query.jobtype;
    }
    let sortOption = {};

    if (sorrt === 'latest') {

        sortOption.createdAt = 'desc';
    }
    if (sorrt === 'oldest') {

        sortOption.createdAt = 'asc';
    }
    if (sorrt === 'a-z') {

        sortOption.position = 'asc';

    }
    if (sorrt === 'z-a') {

        sortOption.position = 'desc';
    }


    Job.find(query).populate('createdBy').sort(sortOption).skip((page - 1) * perPage).limit(perPage).then(job => {

        Job.find(query).populate('createdBy').sort(sortOption).countDocuments().then(count => {

            const numOfPages = count < perPage ? 1 : Math.ceil(count / perPage);

            return response.status(200).json({ jobs: job, totaljobs: count, numOfPages: numOfPages });
        })
    }).catch(error => {
        error.code = 422;
        throw error;
    });
    /* 
        Job.find({$and:[{createdBy:request.userId},{$or:[{position:{$ne : search}},{position:{$regex:`^.*${search}.*$`,$options:'i'}}]}]}).skip((page - 1) * perPage).limit(perPage).then(job => {
            
            Job.find({$and:[{createdBy:request.userId},{$or:[{position:{$ne : search}},{position:{$regex:`^.*${search}.*$`,$options:'i'}}]}]}).countDocuments().then(count => {

                const numOfPages = count < perPage ? 1 : Math.ceil(count / perPage);

                return response.status(200).json({ jobs: job, totaljobs: count, numOfPages: numOfPages });
            })
        }).catch(error => {
            error.code = 422;
            throw error;
        }); */

    /* 
            Job.find({ $and: [{ status: { $eq: status } }, { jobType: { $eq: jobType } }] }).where({ createdBy: request.userId }).skip((page - 1) * perPage).limit(perPage).then(job => {
    
                Job.find({ $or: [{ status: { $eq: status } }, { jobType: { $eq: jobType } }] }).where({ createdBy: request.userId }).countDocuments().then(count => {
    
                    const numOfPages = count < perPage ? 1 : Math.ceil(count / perPage);
    
                    return response.status(200).json({ jobs: job, totaljobs: count, numOfPages: numOfPages });
                })
            }).catch(error => {
                error.code = 422;
                throw error;
            }); */


}
exports.getstats = async (request, response, next) => {
    let declineJobs = 0;
    let inteviewJobs = 0;
    let pendingJobs = 0;

    const job = await Job.find({ createdBy: request.userId });
    job.map(j => {
        if (j.status === 'declined') {
            declineJobs++;
        }
        if (j.status === 'interview') {
            inteviewJobs++;
        }
        if (j.status === 'pending') {
            pendingJobs++;
        }

    })
    /*   await Job.aggregate([
         {
             $match: { createdBy:{$eq:new ObjectID("$"+request.userId)} }
         },]).then(result => {
             console.log(result)
         }) */
    await Job.aggregate([
        {
            $match: { createdBy: new ObjectID(request.userId) }

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

    ])
        .then(result => {
            console.log(result);
            response.json({
                defaultStats: { pending: pendingJobs, interview: inteviewJobs, declined: declineJobs }, monthlyApplications: result.map(r => {
                    return { date: r.month + " " + r.year, count: r.total };
                })
            });
        })
        .catch((error) => {

            // Handle the error
            response.status(500).json({ error: "error" });
        });
}


exports.updateJob = (request, response, next) => {
    console.log(request.params.jobId);

    console.log(request.userId);

    const position = request.body.position;
    const company = request.body.company;
    const jobLocation = request.body.jobLocation;
    const jobType = request.body.jobType;
    const status = request.body.status;

    console.log(request.body);
    if (!request.isAuth) {
        const error = new Error('Your Dont have permission to delete this job');
        error.code = 422;
        throw error;

    }
    User.findOne({ _id: request.userId }).then(user => {

        if (!user) {
            const error = new Error("user not found");
            error.code = 401;
            throw error;
        }
        const job = user.jobs.map(job => {
            if (job.toString() === request.params.jobId.toString()) {
                return job;
            }
        })

        Job.findOne({ _id: job }).then(post => {

            post.position = position;
            post.company = company;
            post.jobLocation = jobLocation;
            post.jobType = jobType;
            post.status = status;

            post.save();

            return response.status(200).json({ updatedJob: post });

        })
    })
}

exports.deleteJob = async (request, response, next) => {
    let loadUser;


    if (!request.isAuth) {
        const error = new Error('You dont have permission to delete');
        error.code = 422;
        throw error;
    }

    console.log("Hello")
    await User.updateMany({}, { $pull: { applyjobs: { jobId: request.params.jobId } } })
    console.log("India")



    User.findOne({ _id: request.userId }).then(user => {
        if (!user) {
            const error = new Error('You dont have permission to delete');
            error.code = 422;
            throw error;
        }

        user.jobs.pull(request.params.jobId);

        user.save();



        Job.deleteOne({ _id: request.params.jobId }).then(result => {
            response.status(200).json({ "msg": "Success! Job removed" });
        }).catch(error => {
            console.log(error);
        })
    })




}

exports.applyJob = async (request, response, next) => {

    const userId = await request.userId;

    let query = { createdBy: { $ne: request.userId } };

    Job.find(query).then(job => {
        response.status(200).json({ jobs: job });
    })

    // User.findOne({_id:request.userId},)
}

exports.addApplyJob = async (request, response, next) => {
    const jobId = request.body._id;
    const jobOwner = request.body.createdBy;
    const candidate = request.userId;

    /*  console.log("Hello");
     console.log(request.body);
     console.log("World");
 
     console.log(jobId);
     console.log(jobOwner);
     console.log(candidate); */

    const job = await Job.findById(jobId);

    const checkApply_status = job.applyJobs.find(job => job.toString() === candidate.toString());

    if (checkApply_status) {
        return response.status(200).json({ message: 'You already apply this job' });
    }
    job.applyJobs.push(candidate);
    await job.save();
    const user = await User.findById(candidate);
    user.applyjobs.push({ jobId: job._id });
    await user.save();
    return response.status(200).json({ message: ' You successfully apply this job' });



    /* const checkApply_status = job.applyJobs.find(job => job.toString() === candidate.toString());

    if (checkApply_status) {
        return response.status(200).json({ message: 'You already apply this job' });*/





}

exports.getApplications = async (request, response, next) => {
    const job = await Job.aggregate([
        { $match: { createdBy: new ObjectID(request.userId)} },
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
            jobStatus: '$status'
          }
        }
      ]);
      
      console.log(job)
      
      
      // updatedArray will contain the retrieved data directly from the database
      

    /* console.log(request.userId);
    const job = await Job.find({ createdBy: request.userId }).populate('applyJobs');




    const user = await job.map(jobs => {


        return jobs?.applyJobs?.map(applyjob => {



            return ({ userId: applyjob._id, userName: applyjob.name, userEmail: applyjob.email, userLocation: applyjob.location, jobId: jobs._id, jobPosition: jobs.position, jobLocation: jobs.jobLocation, jobStatus: jobs.status });



            // console.log(applyjob.name);
            // newApplyjobId.push(applyjob);
        });




    });
    

    const newArray = user.flat(1);
    const uses = await User.find();

    const jobstatus = [];


    uses.map(userss => {
        newArray.map(newjob => {
            if (newjob.userId.toString() === userss._id.toString()) {
                userss.applyjobs.map(jobss => {
                    if (jobss.jobId.toString() === newjob.jobId.toString()) {
                        jobstatus.push({ jobId1: jobss.jobId, userid:userss._id, status1: jobss.status });
                    }
                });
            }
        })

    });

    newArray.map((aray, index) => {
        return jobstatus.map(staus => {

            if (aray.jobId.toString() === staus.jobId1.toString() && aray.userId.toString() === staus.userid.toString()) {
                newArray[index].jobStatus = staus.status1;
            }
        })
    })
console.log("new  +++++++++++++++++++++")
console.log(newArray);
console.log("new  +++++++++++++++++++++")
console.log(jobstatus);

    response.status(200).json({ jobs: newArray })  */

    /* newArray.map(newarray => {
         
    })
    console.log("World");






    /*  const users = await User.find({_id:{$in:['649a83cb7596d2a695989a22','649ab1567bc4f8ff7474803f']}});
 
     console.log(users); */




}



exports.getUserJobApplications = async (request, response, next) => {
    console.log("getUserJobApplications called");
    console.log(request.userId);
    const user = await User.findById(request.userId).populate('applyjobs.jobId');
    console.log(user.applyjobs);
    /* const job = await Job.find({applyJobs:{$in:request.userId}}).then(appliedJobs => {
        
        return appliedJobs;
    }) */

    if (user.applyjobs) {
        response.status(200).json({ jobs: user.applyjobs });
    }
    else {
        response.status(200).json({ message: "job not Found" });
    }
    /* .catch(error => {
        
    }); */


}

exports.updateApplicationRequest = async (request, response, next) => {
    console.log("Hello")
    console.log(request.body)
    console.log("World")

    const user = await User.findOneAndUpdate({ _id: request.body.userID, applyjobs: { $elemMatch: { jobId: request.body.jobID } } }, { $set: { "applyjobs.$.status": request.body.selectionRequest } },{ new: true });
    // console.log(user);
    if (user) {
        console.log(user);
    }
    response.json({ user: user });
}