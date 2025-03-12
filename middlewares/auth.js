import { User } from "../models/userSchema.js";
import { catchAsyncErrors } from "./catchAsyncError.js";
import ErrorHandler from "./error.js";
import jwt from "jsonwebtoken";

export const isAuthenticated = catchAsyncErrors(async (req, res, next) => {
  const { token } = req.cookies;
  if (!token) {
    return next(new ErrorHandler("User not Authenticated!", 400));
  }
  const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);   // try to get user  which is set using token in userschema file
  req.user = await User.findById(decoded.id); // try to get that user in the database
  next();
});

///as your previous project service > auth.js (setuser and get user using jsonwebtoken ) not using statefull authentication 
//memory extensive using map


// Middleware for role-based access control
export function restrictTo(roles = []) {
  return function (req, res, next) {
    const token_cookie = req.cookies?.token;
    const user = getUser(token_cookie); 
    req.user = user;
    console.log(req.user);
    if (!req.user) {
      return res.redirect('/sign_in'); // Redirect if user is not authenticated
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).send('Unauthorized'); // Deny access if user role is not allowed
    }

    next(); // Proceed if the user's role is authorized
  };
}
