const express = require('express');

const router = express.Router();
const userAuth = require('../controllers/auth');
const isAuth = require('../middleware/isauth');


router.post('/register',userAuth.registerUser);
router.post('/login',userAuth.loginUser);
router.patch('/updateUser',isAuth,userAuth.updateUser);

module.exports = router; 
