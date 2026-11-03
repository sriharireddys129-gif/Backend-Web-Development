'use strict';

const passport = require('passport');
const { Strategy: GoogleStrategy } = require('passport-google-oauth20');
const { users, nextId } = require('../data');

async function verifyCallback(accessToken, refreshToken, profile, done) {
  try {
    const googleId = profile.id;
    const email = profile.emails[0].value;
    const name = profile.displayName;

    // 1. Check for an existing Google user
    let user = users.find(user => user.googleId === googleId);

    if (user) {
      return done(null, user);
    }

    // 2. Check for an existing local account
    user = users.find(user => user.email === email);

    if (user) {
      // Only link accounts if Google's email is verified
      if (profile._json.email_verified === true) {
        user.googleId = googleId;
        return done(null, user);
      }

      return done(null, false);
    }

    // 3. Create a new user
    const newUser = {
      id: nextId(),
      googleId: googleId,
      email: email,
      name: name,
      role: 'member'
    };

    users.push(newUser);

    return done(null, newUser);

  } catch (err) {
    return done(err);
  }
}

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID || 'test-client-id',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || 'test-client-secret',
      callbackURL: '/auth/google/callback',
    },
    verifyCallback,
  ),
);

module.exports = { passport, verifyCallback };