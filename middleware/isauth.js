const jwt = require('jsonwebtoken');

module.exports  = async (request,response,next) => {
    const authorization = request.get('Authorization');
   
    
    if(!authorization){
      
        request.isAuth = false;
        return next();
    }
    const token = authorization.slice(7);

    let decodeToken;

    try{
        decodeToken = jwt.verify(token,'somesupersecretsecret');
                                        
    }catch(error){
        request.isAuth = false;
        return next();
    }
    if(!decodeToken){
        request.isAuth = false;
        return next();
    }
    request.userId = decodeToken.userId;
   
    request.isAuth = true;
    
    next();
     
} 

