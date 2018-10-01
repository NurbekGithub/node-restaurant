const passport = require('passport');
const mongoose = require('mongoose');
const crypto = require('crypto');
const promisify = require('es6-promisify');
const User = mongoose.model('User');
const mail = require('../handlers/mail');

exports.login = passport.authenticate('local', {
  failureRedirect: '/login',
  failureFlash: 'Failed login',
  successRedirect: '/',
  successFlash: 'You are now logged in!'
})

exports.logout = (req, res) => {
  req.logout();
  req.flash('success', 'You are now logged out 👋');
  res.redirect('/');
}

exports.isLoggedIn = (req, res, next) => {
  if(req.isAuthenticated()) {
    next();
  } else {
    req.flash('error', 'Opps, you must be logged in');
    res.redirect('/login')
  }
}

exports.forgotPassword = async (req, res) => {
  //check if user exists
  const user = await User.findOne({ email: req.body.email });
  if(!user) {
    req.flash('error', 'No account with that email exists');
    return res.redirect('/login');
  }
  //set reset tokens and expire time for it
  user.resetPasswordToken = crypto.randomBytes(20).toString('hex');
  user.resetPasswordExpireTime = Date.now() + 3600000; //1hour from now
  user.save();
  //send email with the token to the user
  const resetURL = `http://${req.headers.host}/account/reset/${user.resetPasswordToken}`;
  await mail.send({
    filename:'password-reset',
    user,
    subject: 'Password Reset',
    resetURL
  })

  //redirect to login page
  req.flash('success', 'New password has been send to you email address')
  res.redirect('/login');
}

exports.reset = async (req, res) => {
  const user = await User.findOne({
    resetPasswordToken: req.params.token,
    resetPasswordExpireTime: { $gt: Date.now() }
  });
  if(!user) {
    req.flash('error', 'Inavalid or expired token');
    return res.redirect('/login')
  }
  //if there is a user show reset password form
  res.render('reset', { title: 'Reset password' });
}

exports.confirmedPasswords = (req, res, next) => {
  if(req.body.password === req.body["confirm-password"]) return next();
  req.flash('error', 'Passwords you\'ve provided do not match');
  res.redirect('back');
}

exports.update = async (req, res) => {
  const user = await User.findOne({
    resetPasswordToken: req.params.token,
    resetPasswordExpireTime: { $gt: Date.now() }
  });

  if(!user) {
    req.flash('error', 'Inavalid or expired token');
    return res.redirect('/login')
  };

  const setPassword = promisify(user.setPassword, user);
  await setPassword(req.body.password);
  user.resetPasswordExpireTime = undefined;
  user.resetPasswordToken = undefined;
  const updatedUser = await user.save();
  await req.login(updatedUser);
  req.flash('success', 'You password has been reset 🎉 and you are now logged in!')
  res.redirect('/')
}
