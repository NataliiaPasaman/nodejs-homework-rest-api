const User = require('./schemas/users');
const jwt = require('jsonwebtoken');
const gravatar = require('gravatar');
const uuid = require('uuid').v4;
const sgMail = require('@sendgrid/mail')
require('dotenv').config();

const SECRET_KEY = process.env.SECRET_KEY;
const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;

sgMail.setApiKey(SENDGRID_API_KEY);


const createUser = async ({email, password}) => {
    const avatarURL = gravatar.url(email);
    const verificationToken = uuid();
    const newUser = new User({ email, password, avatarURL, verificationToken });
    newUser.setPassword(password);
    await newUser.save();

    const msg = {
        to: email,
        from: 'natapasaman@gmail.com',
        subject: 'Please, confirm registration',
        text: `Follow the link to confirm registration: GET /users/verify/:${verificationToken}.`,
        html: `<a target="_blank" href="http://localhost:8080/api//users/verify/:${verificationToken}">Follow the link to confirm registration</a>`,
      }

      sgMail.send(msg)
        .then(() => console.log("Verification Token send in your email"))
        .catch((error) => console.error(error));

    return newUser;
}

const verificationEmail = async (user) => {
    const verifyUser = await User.findOneAndUpdate(
        { _id: user.id },
        {verificationToken: null, verify: true},
        { new: true });
    return verifyUser;
}

const sendRepeatEmail = async ({email, verificationToken}) => {
    const msg = {
        to: email,
        from: 'natapasaman@gmail.com',
        subject: 'Please, confirm registration',
        text: `Follow the link to confirm registration: GET /users/verify/:${verificationToken}.`,
        html: `<a target="_blank" href="http://localhost:8080/api//users/verify/:${verificationToken}">Follow the link to confirm registration</a>`,
      }

      sgMail.send(msg)
        .then(() => console.log("Verification Token resend in your email"))
        .catch((error) => console.error(error));
}

const loginUser = async (user) => {
    const payload = { id: user.id };
    const token = jwt.sign(payload, SECRET_KEY, {expiresIn: '2h'});

     await User.findOneAndUpdate(
        { _id: user.id },
        {'token': token},
        { new: true }
        )
    return token;
}

const logoutUser = async (userId) => {
    const user = await User.findByIdAndUpdate(userId, {token: null})
    return user;
}

const updateUserSubscription = async( _id, sub) => {
    const subscriptionUpdated = await User.findOneAndUpdate(
        { _id: _id }, { subscription: sub }, { new: true });

    return subscriptionUpdated;
}

const updateUserAvatar = async (userId, avatar) => {
    const avatarUpdated = await User.findOneAndUpdate(
        { _id: userId }, { avatarURL: avatar }, { new: true }
    );
    return avatarUpdated.avatarURL;
}

module.exports = {
    createUser,
    verificationEmail,
    sendRepeatEmail,
    loginUser, 
    logoutUser,
    updateUserSubscription,
    updateUserAvatar,
}