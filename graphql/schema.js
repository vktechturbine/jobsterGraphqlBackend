/*   */
import { gql } from 'graphql-tag';

export const typeDefs = gql`
     

        
        type Jobs{
            _id:ID!
            position:String!
            company:String!
            jobLocation:String!
            status:String!
            jobType:String!
            createdBy:String!
            createdAt:String!
            updatedAt:String!
            applyJobs:[Users!]
            }  
            type Applyjobs{
                jobId:[Jobs!]!
                statsu:String!
            }
            input userInputData{
                email:String!
                name:String!
                password:String!
            }
            input userUpdateInputData{
                email:String!
                name:String!
                lastName:String!
                location:String!
            }
        type Users{
        _id:ID!
        email:String!
        password:String!
        name:String!
        lastName:String!
        location:String!
        jobs:[Jobs!]!
        applyjobs:[Applyjobs!]!

        }  
        type AuthData{
            token:String!
            userId:String!
            email:String!
            name:String!
            lastName:String!
            location:String!
            
        }
        input jobInputData{
            position:String!
            company:String!
            jobLocation:String!
            jobType:String!
            status:String!
        }
        input filterOptionInput{
            page:Int!
            search:String
            status:String!
            type:String!
            sort:String! 
        }
        type filterOptionData
        {
            jobs:[Jobs!]
            totalJobs:Int!
            numbofJobs:Int!
        }
        type getAllJobs{
            jobs:[Jobs!]
        }
        type defaultStats{
            pending: Int
            interview: Int
            declined: Int
        }
        type monthlyApplications{
            date:String
            count:Int
        }
        type statsData{
            defaultStats:defaultStats!
            monthlyApplications:[monthlyApplications!]!
        }

        type applyjobmessage{
            message:String!
        }

        input requestInput{
            jobId:String!
            jobOwner:String!
        }
        type userAppliedJobs{
            position:String!
            company:String!
            location:String!
            jobType:String!
            jobStatus:String!
        }
        type getappliedJobs{
            userAppliedJobs:[userAppliedJobs]
        }
        type applicationOtherUser{
            userId: String!
            userName: String!
            userEmail: String!
            userLocation: String!
            jobId: String!
            jobPosition: String!
            jobLocation: String!
            jobStatus:String!
        }
        type otherUserapplication{
            applicationOtherUser:[applicationOtherUser]
        }
        input applicationsRequests{
            jobId:String!
            selectionRequestId:String!
            userId:String!
        }
        input deleteJobRequest{
            jobId:String!
        }
        input updateJobInput{
            position:String!
            company:String!
            jobLocation:String!
            jobType:String!
            status:String!
        }
        
       
        type Mutation{
            createUser (userInput:userInputData) : AuthData!
            updateuserProfiile(userInput:userUpdateInputData):AuthData!
            createJob(jobInput:jobInputData):Jobs!
            aplyjobRequest(requestInput:requestInput):applyjobmessage!
            applicationRequest(applicationRequestInput:applicationsRequests):applyjobmessage!
            deleteJobRequest(deleteJobInput:deleteJobRequest):applyjobmessage!
            updateJobRequest(updateJobInput:updateJobInput,jobId:String!):applyjobmessage!
        }
    
        type Query{
            login(email:String!,password:String!):AuthData!
            jobs(searchJobInput:filterOptionInput!):filterOptionData!
            stats:statsData!
            seekingJob:getAllJobs!
            appliedJobs:getappliedJobs
            showAnotheruserApplication:otherUserapplication
        }
        
`

