const createError = require('http-errors');
const path = require('path');
const fs = require('fs/promises');
const Jimp = require("jimp");
const User = require('../service/schemas/users');
const { 
  createUser, 
  verificationEmail, 
  sendRepeatEmail, 
  loginUser, 
  logoutUser, 
  updateUserSubscription, 
  updateUserAvatar, 
 } = require('../service/userService');

const create = async (req, res, next) => {
  const { email, password } = req.body;

  const checkEmail = await User.findOne({ email });
  if (checkEmail) return next(createError(409, "Email in use"));

  const user = await createUser({ email, password });

  res.status(201).json({
    data: {
      user: {
        email: user.email,
        subscription: user.subscription,
      },
    },
  });
};

const verification = async (req, res, next) => {
  const { verificationToken } = req.params;
  const candidate = await User.findOne({verificationToken});

  if (!candidate) {
    return next(createError(404, "User not Found"));
  }

  await verificationEmail(candidate);

  res.status(200).json({message: 'Verification successful'});
}

const repeatVerification = async (req, res, next) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ message: "Missing required field email" });
  }

  const user = await User.findOne({ email });
  if (!user) return next(createError(401, "Not found"));

  const { verify, verificationToken } = user;

  if (verify) {
    return res.status(400).json({ message: "Verification has already been passed" });
  }

  await sendRepeatEmail({ email, verificationToken });
  res.status(200).json({ message: "Verification email sent" });
};

const login = async (req, res, next) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email });
  if (!user || !user.comparePass(password)) {
    return next(createError(401, "Email or password is wrong"));
  };

  if (user.verify === false) {
    return next(createError(400, "User has not passed the verification process"))
  }

  const token = await loginUser(user);

  res.status(200).json({
    token: token,
    user: {
      email: user.email,
      subscription: user.subscription,
    },
  });
};


const logout = async(req, res, next) => {
  const { _id } = req.user;
  const user = await logoutUser({_id});

  if(!user.token) {
    return next(createError(401, "Not authorized"))
  };

  res.status(204).json();
}


const currentUser = async (req, res, next) => {
  res.status(200).json({
    data: {
      user: {
        email: req.user.email,
        subscription: req.user.subscription,
      },
    },
  });
};


const updateSubscription = async (req, res, next) => {
  const { _id } = req.user;
  const userSubscription = await updateUserSubscription(_id, req.body.subscription);

  if (!userSubscription) {
    return next(createError(404, "'Not found"));
  }

  res.status(200).json({
    data: {
      subscription: userSubscription.subscription,
    },
  });
};


const updateAvatar = async (req, res, next) => {
  const { path: tmpUpload, originalname } = req.file;
  const imageName = `${req.user._id}_${originalname}`;
  const resultUpload = path.join( __dirname, "../", "public", "avatars", imageName);

  try {
    const image = await Jimp.read(tmpUpload);
    await image
      .autocrop()
      .cover(250, 250, Jimp.HORIZONTAL_ALIGN_CENTER || Jimp.VERTICAL_ALIGN_MIDDLE)
      .writeAsync(tmpUpload);
  
    await fs.rename(tmpUpload, resultUpload);

    const avatarUrl = path.join("avatars", imageName);
    const changeAvatar = await updateUserAvatar(req.user._id, avatarUrl);

    res.status(200).json({ avatarURL: changeAvatar });
  } catch (error) {
    console.log(error);
    fs.unlink(tmpUpload);
  }
};

module.exports = {
  create,
  verification,
  repeatVerification,
  login,
  logout,
  currentUser,
  updateSubscription,
  updateAvatar,
};
