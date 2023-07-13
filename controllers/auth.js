const User = require('../models/user');
const validator = require('validator');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
exports.registerUser = (request, response, next) => {

    console.log()
    const name = request.body.name;
    const email = request.body.email;
    const password = request.body.password;

    const users = User.findOne({ email: email }).then(user => {


        if (user) {
            console.log("user found");
            return response.status(200).json("user has already registered");
        }
        if (!validator.isEmail(email)) {
            console.log('invalid email')
        }

        if (validator.isEmpty(password) || !validator.isLength(password, { min: 5 })) {
            console.log('Password is to short');
        }
    });
    bcrypt.hash(password, 12).then(hashpw => {
        console.log(email)

        const user = new User({
            email: email,
            password: hashpw,
            name: name
        })


        return user.save();
    }).then(user => {
        if (user) {
            const token = jwt.sign({
                userId: user._id.toString(),
                email: user.email
            }, 'somesupersecretsecret', { expiresIn: '1h' });
            return response.status(200).json({ email: user.email, lastName: user.lastName, location: user.location, name: user.name, token: token });
        }
    }).catch(error => {
        console.log(error);
    })

}

exports.loginUser = (request, response, next) => {

    const email = request.body.email;
    const password = request.body.password;
    let loadUser;
    console.log(request.body.password);

    User.findOne({ email: email }).then(user => {
        console.log(user);
        loadUser = user;
        if (!user) {
            console.log("user not found")
        }
        return bcrypt.compare(password, user.password);
    }).then(isEqual => {
        console.log(isEqual)
        if (!isEqual) {
            const error = new Error("Password is not match");
            error.statusCode = 422;
            response.status(422).json({ message: error.message });
            // throw error;
        }
        else {

            const token = jwt.sign({
                userId: loadUser._id.toString(),
                email: loadUser.email
            }, 'somesupersecretsecret');

            return response.status(200).json({ email: loadUser.email, lastName: loadUser.lastName, location: loadUser.location, name: loadUser.name, token: token });

        }
    }).catch(error => {
        console.log(error);
    })
}

exports.updateUser = (request, response, next) => {
    const name = request.body.name;
    const email = request.body.email;
    const lastname = request.body.lastName;
    const location = request.body.location;

    if (!request.isAuth) {
        const error = new Error('Invalid User');
        error.code = 422;
        throw error;
    }

    User.findOne({ _id: request.userId }).then(user => {
        if (!user) {
            const error = new Error('Invalid User');
        }

        user.name = name;
        user.email = email;
        user.lastName = lastname;
        user.location = location;

        return user.save();
    }).then(user => {
        const token = jwt.sign({
            userId: user._id.toString(),
            email: user.email
        },'somesupersecretsecret')
        response.status(200).json({ email: user.email, lastName: user.lastName, location: user.location, name: user.name, token: token });
    }).catch(error => {
        error.code = 422;
        throw error;
    })

}