
// ==== mongooseUser database access
  var database = require('./database.js')
  var User = database.User;

// ==== pastport part
var LocalStrategy = require('passport-local').Strategy;

module.exports = function(passport){
  passport.serializeUser(function(user,done){
    done(null,user.id);
  });

  passport.deserializeUser(function(id,done){
    User.findById(id,function(err,user){
      done(err,user);
    });
  });

  passport.use('local-signup', new LocalStrategy({
    usernameField: 'email',
    passwordField: 'password',
    passReqToCallback: true
  },
  function(req,email,password,done){
    //asynchronous
    // User.findOne wont fire unless data is sent back
    process.nextTick(function(){
      User.findOne({'local.email': email}, function(err,user){
        if(err)
          return done(err);
        if (user){
          return done(null,false,req.flash('signupMessage','That email is already taken.'));
        }else{
          var newUser = new User();
          newUser.local.email = email;
          newUser.local.password = newUser.generateHash(password)
          newUser.local.isUser = true;
          newUser.save(function(err){
            if(err) throw err;
            return done(null, newUser);
          });
          
        }
      });
    });
  }
  ))

  passport.use('local-login', new LocalStrategy({
    usernameField:'email',
    passwordField:'password',
    passReqToCallback:true
  },
  function(req,email,password,done){
    console.log("from login")
    User.findOne({ 'local.email' :  email }, function(err, user) {
        // if there are any errors, return the error before anything else
        if (err)
            return done(err);

        // if no user is found, return the message
        if (!user)
            return done(null, false, req.flash('loginMessage', 'No user found.')); // req.flash is the way to set flashdata using connect-flash

        // if the user is found but the password is wrong
        if (!user.validPassword(password))
            return done(null, false, req.flash('loginMessage', 'Oops! Wrong password.')); // create the loginMessage and save it to session as flashdata

        // all is well, return successful user
        return done(null, user);
        //return res.redirect('/tutor');
    });
  }
  ))
}













