import express from 'express';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken'
import bodyParser from 'body-parser';
import cors  from 'cors';
import { typeDefs } from './graphql/schema.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);

const __dirname = path.dirname(__filename);



import { resolvers } from './graphql/resolvers.js';
import http from 'http';

/* Apollo server packages */
import { ApolloServer } from "@apollo/server";
import { ApolloServerPluginDrainHttpServer } from "@apollo/server/plugin/drainHttpServer";
import { expressMiddleware } from '@apollo/server/express4';

import helmet from 'helmet';
import morgan from 'morgan';



const app = express();

const accessLogStream = fs.createWriteStream(path.join(__dirname, 'access.log'),{flags:'a'})

app.use(helmet());
app.use(morgan('combined',{stream:accessLogStream}));

app.use(bodyParser.urlencoded({extended:true}));
app.use(bodyParser.json())

app.use(cors());

const httpServer = http.createServer(app);

const server = new ApolloServer({
    typeDefs, resolvers, plugins: [ApolloServerPluginDrainHttpServer({ httpServer })], formatError(formattedError, error) {
        if (!error.originalError) {

            return error;
        }
        const data = error.originalError.data;
        const message = error.message || 'An error occurred';
        const code = error.originalError.code || 500;
        return {
            message: message,
            status: code,
            data: data
        }
    },
});


await server.start();



app.use((error, request, response, next) => {

    const status = error.statusCode;
    const message = error.message;
    
    console.log(error)
    console.log(status);
    response.status(200).json({ message: message});
    
})

app.use(
    '/graphql',
    cors(),
    bodyParser.json(),


    expressMiddleware(server, {
        context: async ({ req }) => {

            try {
                const token = req.headers.authorization;
                
                if (!token) {
                    return { user: null, isAuth: false };
                }
                const decode = jwt.verify(token.slice(7), 'somesupersecretsecret')
                console.log(decode);
               
                return { user: decode, isAuth: true };
            } catch (error) {
                return { user: null, isAuth: false }
            }

        },
    }),
);

mongoose.connect(`mongodb+srv://${process.env.MONGO_USER}:${process.env.MONGO_PASSWORD}@cluster0.y1iwedf.mongodb.net/${process.env.MONGO_DATABASE}`).then(result => {
    console.log("Connected");
 
}).catch(error => {
    console.log("Not Connected");
})


await new Promise((resolve) => httpServer.listen({ port: process.env.PORT || 3001 },resolve));
