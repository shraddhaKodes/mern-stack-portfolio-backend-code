import { v2 as cloudinary } from "cloudinary";
import { catchAsyncErrors } from "../middlewares/catchAsyncError.js";
import { User } from "../models/userSchema.js";
import ErrorHandler from "../middlewares/error.js";
import { generateToken } from "../utils/jwtToken.js";
import crypto from "crypto";
import { verifyEmail, sendEmail } from "../utils/sendEmail.js";

export const register = catchAsyncErrors(async (req, res, next) => {
  if (!req.files || Object.keys(req.files).length === 0) {
    return next(new ErrorHandler("Avatar and Resume are required!", 400));
  }

  const { avatar, resume } = req.files;
  const {
    fullName,
    email,
    phone,
    aboutMe,
    password,
    portfolioURL,
    githubURL,
    instagramURL,
    twitterURL,
    facebookURL,
    linkedInURL,
  } = req.body;

  // **🔹 Verify Email before proceeding**
  const isEmailValid = await verifyEmail(email);
  if (!isEmailValid) {
    return next(
      new ErrorHandler("Invalid Email! Please use a valid email address.", 400)
    );
  }
  console.log("to upload files");
  // **🔹 Upload Avatar to Cloudinary**
  const cloudinaryResponseForAvatar = await cloudinary.uploader.upload(
    avatar.tempFilePath,
    { folder: "PORTFOLIO AVATAR" }
  );
  if (!cloudinaryResponseForAvatar.secure_url) {
    return next(new ErrorHandler("Failed to upload avatar to Cloudinary", 500));
  }

  // **🔹 Upload Resume to Cloudinary**
  const cloudinaryResponseForResume = await cloudinary.uploader.upload(
    resume.tempFilePath,
    {
      folder: "PORTFOLIO_RESUME",
      resource_type: "raw", // 👈 Important for PDFs
      format: "pdf", // 👈 Ensures it remains a valid PDF
      access_mode: "public", // 👈 Ensures it's publicly accessible
    }
  );
  if (!cloudinaryResponseForResume.secure_url) {
    return next(new ErrorHandler("Failed to upload resume to Cloudinary", 500));
  }

  // **🔹 Send Registration Confirmation Email**
  const emailSubject = "Welcome to Our Platform!";
  const emailMessage = `Hello ${fullName},\n\nWelcome to our platform! Your registration was successful.\n\nBest Regards,\nTeam`;

  console.log("try to send message");
  await sendEmail(email, emailSubject, emailMessage);

  // **🔹 Create User in Database**
  const user = await User.create({
    fullName,
    email,
    phone,
    aboutMe,
    password,
    portfolioURL,
    githubURL,
    instagramURL,
    twitterURL,
    facebookURL,
    linkedInURL,
    avatar: {
      public_id: cloudinaryResponseForAvatar.public_id,
      url: cloudinaryResponseForAvatar.secure_url,
    },
    resume: {
      public_id: cloudinaryResponseForResume.public_id,
      url: cloudinaryResponseForResume.secure_url,
    },
  });

  // **🔹 Generate Token and Respond**
  generateToken(user, "Registered Successfully!", 201, res);
});

export const login = catchAsyncErrors(async (req, res, next) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return next(new ErrorHandler("Provide Email And Password!", 400));
  }
  const user = await User.findOne({ email }).select("password");
  if (!user) {
    return next(new ErrorHandler("Invalid Email Or Password!", 404));
  }
  const isPasswordMatched = await user.comparePassword(password);
  if (!isPasswordMatched) {
    return next(new ErrorHandler("Invalid Email Or Password", 401));
  }
  generateToken(user, "Login Successfully!", 200, res);
});

export const logout = catchAsyncErrors(async (req, res, next) => {
  res
    .status(200)
    .cookie("token", "", {
      httpOnly: true,
      expires: new Date(Date.now()),
    })
    .json({
      success: true,
      message: "Logged Out!",
    });
});

export const getUser = catchAsyncErrors(async (req, res, next) => {
  const user = await User.findById(req.user.id);
  res.status(200).json({
    success: true,
    user,
  });
});

export const updateProfile = catchAsyncErrors(async (req, res, next) => {
  const newUserData = {
    fullName: req.body.fullName,
    email: req.body.email,
    phone: req.body.phone,
    aboutMe: req.body.aboutMe,
    githubURL: req.body.githubURL,
    instagramURL: req.body.instagramURL,
    portfolioURL: req.body.portfolioURL,
    facebookURL: req.body.facebookURL,
    twitterURL: req.body.twitterURL,
    linkedInURL: req.body.linkedInURL,
  };
  if (req.files && req.files.avatar) {
    const avatar = req.files.avatar;
    const user = await User.findById(req.user.id);
    const profileImageId = user.avatar.public_id;
    await cloudinary.uploader.destroy(profileImageId);
    const newProfileImage = await cloudinary.uploader.upload(
      avatar.tempFilePath,
      {
        folder: "PORTFOLIO AVATAR",
      }
    );
    newUserData.avatar = {
      public_id: newProfileImage.public_id,
      url: newProfileImage.secure_url,
    };
  }

  if (req.files && req.files.resume) {
    const resume = req.files.resume;
    const user = await User.findById(req.user.id);
    const resumeFileId = user.resume.public_id;
    if (resumeFileId) {
      await cloudinary.uploader.destroy(resumeFileId);
    }
    const newResume = await cloudinary.uploader.upload(resume.tempFilePath, {
      folder: "PORTFOLIO RESUME",
    });
    newUserData.resume = {
      public_id: newResume.public_id,
      url: newResume.secure_url,
    };
  }

  const user = await User.findByIdAndUpdate(req.user.id, newUserData, {
    new: true,
    runValidators: true,
    useFindAndModify: false,
  });
  res.status(200).json({
    success: true,
    message: "Profile Updated!",
    user,
  });
});

export const updatePassword = catchAsyncErrors(async (req, res, next) => {
  const { currentPassword, newPassword, confirmNewPassword } = req.body;
  const user = await User.findById(req.user.id).select("password");
  if (!currentPassword || !newPassword || !confirmNewPassword) {
    return next(new ErrorHandler("Please Fill All Fields.", 400));
  }
  const isPasswordMatched = await user.comparePassword(currentPassword);
  if (!isPasswordMatched) {
    return next(new ErrorHandler("Incorrect Current Password!"));
  }
  if (newPassword !== confirmNewPassword) {
    return next(
      new ErrorHandler("New Password And Confirm New Password Do Not Match!")
    );
  }
  user.password = newPassword;
  await user.save();
  res.status(200).json({
    success: true,
    message: "Password Updated!",
  });
});

export const getUserForPortfolio = catchAsyncErrors(async (req, res, next) => {
  const id = "67cda4986b859466f3f1ec68";
  const user = await User.findById(id);
  res.status(200).json({
    success: true,
    user,
  });
});

// **Forgot Password**
export const forgotPassword = catchAsyncErrors(async (req, res, next) => {
  const user = await User.findOne({ email: req.body.email });

  if (!user) {
    return next(new ErrorHandler("User Not Found!", 404));
  }

  // **Generate Reset Token**
  const resetToken = user.getResetPasswordToken();
  await user.save({ validateBeforeSave: false });

  // **Create Reset Password URL**
  const resetPasswordUrl = `${process.env.DASHBOARD_URL}/password/reset/${resetToken}`;

  // **Email Content**
  const emailSubject = "Personal Portfolio Dashboard Password Recovery";
  const emailMessage = `Hello ${user.fullName},\n\nYou requested a password reset. Click the link below to reset your password:\n\n${resetPasswordUrl}\n\nIf you did not request this, please ignore this email.\n\nBest Regards,\nTeam`;

  console.log(`📩 Sending password reset email to: ${user.email}`);
  console.log(`🔗 Reset URL: ${resetPasswordUrl}`);

  try {
    // **Send Email**
    await sendEmail(user.email, emailSubject, emailMessage);

    console.log("✅ Email Sent Successfully!");

    res.status(201).json({
      success: true,
      message: `Email sent to ${user.email} successfully`,
    });
  } catch (error) {
    console.error("❌ Error Sending Email:", error);

    // **Reset Token if Email Fails**
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save({ validateBeforeSave: false });

    return next(new ErrorHandler("Email could not be sent. Please try again.", 500));
  }
});

//RESET PASSWORD
export const resetPassword = catchAsyncErrors(async (req, res, next) => {
  console.log("enter for the reset password") ;
  const { token } = req.params;
  const resetPasswordToken = crypto
    .createHash("sha256")
    .update(token)
    .digest("hex");
  const user = await User.findOne({
    resetPasswordToken,
    resetPasswordExpire: { $gt: Date.now() },
  });
  if (!user) {
    return next(
      new ErrorHandler(
        "Reset password token is invalid or has been expired.",
        400
      )
    );
  }

  if (req.body.password !== req.body.confirmPassword) {
    return next(new ErrorHandler("Password & Confirm Password do not match"));
  }
  user.password =  req.body.password;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpire = undefined;

  await user.save();

  generateToken(user, "Reset Password Successfully!", 200, res);
});

export const getAllUser = catchAsyncErrors(async (req, res, next) => {
  const users = await User.find({}); // Use await
  res.status(200).json({
    success: true,
    users,
  });
});
