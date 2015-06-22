var express = require("express");
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var path=require('path');
var passport = require('passport');
var flash    = require('connect-flash');
var helmet = require('helmet');
var morgan       = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser   = require('body-parser');
var session      = require('express-session');
var querystring = require('querystring');
var request = require('request');
var colors = require('colors');

//++++++++
var nodemailer = require("nodemailer");

var transporter = nodemailer.createTransport({
    service: 'Gmail',
    auth: {
        user: 'ginx.qx@gmail.com',
        pass: 'ili7mlilolk'
    }
});





// var fs=require('fs');
var port = process.env.PORT||3000;
var router = express.Router();
app.use(helmet());
app.use(morgan('dev')); 
app.use(cookieParser());
app.use(bodyParser.json()); 
app.use(bodyParser.urlencoded({ extended: true }));
app.set('view engine', 'ejs'); 
app.use(session({ secret: 'ilovescotchscotchyscotchscotch' }));
app.use(passport.initialize());
app.use(passport.session());
app.use(flash()); 
app.use(express.static(path.join(__dirname, 'views')));
require('./config/passport.js')(passport); 

//== DB
var database = require('./config/database.js')
var Card = database.Card;
var User = database.User;
var Story = database.Story;
var Firebase = require("firebase");
// var Fire = new Firebase("https://langtimedev.firebaseio.com/")

var Fire = new Firebase("https://langtime002.firebaseio.com")




//== AWS
var aws = require('aws-sdk');
var s3 = new aws.S3();
var BUCKET_NAME = "langtime";

if(s3.config.aws_access_key_id==undefined){
  s3.config.update({
    accessKeyId: process.env.aws_access_key_id,
    secretAccessKey: process.env.aws_secret_access_key
  });
}



// paypal stuff


app.get('/paypalReturn', function(req, res){
  res.end('Response will be available on console, nothing to look here!');
});

app.post('/paypalReturn', function(req, res){
    Fire.child("rowRecord").push(req.body)
    if(req.body.payment_status=="Completed"){
      var chckObj=String(req.body.verify_sign);
      var chck=chckObj.substring(0,6);
      Fire.child("payRecord").child(chck).update(req.body);
      Fire.child("pendingRecord").child(chck).remove();

      User.findOne({ 'local.email' :  req.body.payer_email },function(err,user){
        var i=user._id;
        var i = i.toString();
        Fire.child("minRecord").child(i).once("value",function(snap){
          if(!(snap.hasChild("sum"))){
            var bt=Number(req.body.quantity)*20
            var now=bt+6
            Fire.child("minRecord").child(i).update({sum:now});
            Fire.child("minRecord").child(i).child(chck).update({bought:bt});
          }else{
            if(!(snap.hasChild(chck))){
              var bt=Number(req.body.quantity)*20
              var now=snap.val()["sum"]+bt*20;
              Fire.child("minRecord").child(i).update({sum:now});
              Fire.child("minRecord").child(i).child(chck).update({bought:bt});
            }
          }
        })
      })
    }else{
      var chck=req.body.verify_sign;
      Fire.child("pendingRecord").child(chck).update(req.body);
    }
    // Fire.child("payRecord").push(req.body);
    // STEP 1: read POST data

    req.body = req.body || {};    
    // res.status(200).send('OK')
    res.writeHead(200, {});
    res.end();

});
  
  

//   Sitemap.xml generating function


function generate_xml_sitemap(){
    var urls=[
      {ns:"",priority:1},
      {ns:"/showcase",priority:0.5},
      {ns:"/comeontutors",priority:0.3}
    ]
    var root_path = 'http://langtime.me';
    
    var freq = 'monthly';
    var xml = '<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">';
    for (var i in urls) {
        xml += '<url>';
        xml += '<loc>'+ root_path + urls[i].ns + '</loc>';
        xml += '<changefreq>'+ freq +'</changefreq>';
        xml += '<priority>'+ urls[i].priority +'</priority>';
        xml += '</url>';
        i++;
    }
    xml += '</urlset>';
    return xml;
}



//== router
  // app zone, pre login
  app.get("/sitemap.xml",function(req,res){
    var sitemap = generate_xml_sitemap(); // get the dynamically generated XML sitemap
    res.header('Content-Type', 'text/xml');
    res.send(sitemap); 
  });

  router.route('/')
        .get(function(req,res){
          if(req.isAuthenticated()&&req.user.local.isUser){
            res.redirect('learn');
          }else if(req.isAuthenticated()&&req.user.local.isTutor){
            res.redirect('tutor');
          }else{
            var d=Date();
            var ip=req.connection.remoteAddress
            var ipstr=ip.replace(/\./g,' ');
            Fire.child("ipRecord").child(ipstr).push(d)
            res.render('index.ejs');
          }
        })

  app.get('/showcase',function(req,res){
    res.render('showcase.ejs',{})
  })

  app.get("/about",function(req,res){
    res.render("about.ejs",{});
  })

  app.get("/blog",function(req,res){
    res.render("blog.ejs");
  })


  app.get("/intensive-spoken-english-training",function(req,res){
    // ask for forgiveness than permission. fake numbers.
    //do a trip to database, report how many people signed up as memeber. 
    //do a trip to firebase, check how many people loaded this page instead. 
    res.render("intensive-spoken-english-training.ejs",{});
  });


  app.get("/demo",function(req,res){
    if(!req.isAuthenticated()){
      res.render('purdue-langtime-on-campus-demo.ejs',{userId:"558066e8ce5fff41ce460e6c"})
    }else{
      res.render('purdue-langtime-on-campus-demo.ejs',{userId:req.user._id})
    }
  })



  router.route('/login')
        .get(function(req, res) {
            if(req.isAuthenticated()){res.redirect('learn');}
            else{res.render('login.ejs',{message: req.flash('loginMessage')});}
        })
        .post(passport.authenticate('local-login',{failureRedirect: '/login',failureFlash: true }),
              function(req,res){
                if(req.user.local.isUser){
                  
                  res.redirect('/learn')
                }else {res.redirect('/tutor')}
        });
          

  app.get('/signup',function(req,res){
        res.render('signup.ejs',{message: req.flash('signupMessage')})
      })

  app.post('/signup', function(req, res, next) {
    passport.authenticate('local-signup', function(err, user, info) {
      if (err) { return next(err); }
      if (!user) { return res.redirect('/signup'); }
      req.logIn(user, function(err) {
        if (err) { return next(err); }
        return res.redirect('/login');
      });
      next()
    })(req, res, next)
    },function(req,res,next){
      var tempId = res.req.user._id;
      var tempTime = new Date();
      var tempT=tempTime.getTime();

      var tempIdStr=String(tempId);
      Fire.child("minRecord").child(tempIdStr).update({sum:6});

      var initCardOne = new Card({
        userId: tempId,
        createdAt: tempT,
        imageUrl:"https://s3.amazonaws.com/langtime007/Screen+Shot+2015-04-16+at+4.07.49+AM.png",
        keyWord0:".",
        keyWord1:".",
        keyWord2:".",
        note0:"LangTime helps you to connect with native speakers",
        note1:"LangTime helps you to visualize your words",
        note2:"LangTime is awesome"
      })
      initCardOne.save(function(err,newCard){
        if(err) return console.log(err);
      })

      var initCardTwo = new Card({
        userId: tempId,
        createdAt: tempT,
        imageUrl:"https://s3.amazonaws.com/langtime007/introduce.jpg",
        keyWord0:".",
        keyWord1:".",
        keyWord2:".",
        note0:"What are you??",
        note1:"What's most interesting about you?",
        note2:"Tutors are very interested in your stories!"
      })
      initCardTwo.save(function(err,newCard){
        if(err) return console.log(err);
      })

      var initCardThree = new Card({
        userId: tempId,
        createdAt: tempT,
        imageUrl:"http://fc02.deviantart.net/fs70/f/2010/017/b/3/Avatar_self_portrait_by_Nuria.jpg",
        keyWord0:".",
        keyWord1:".",
        keyWord2:".",
        note0:"Upload Your own pictures",
        note1:"Tell the stories from your own life",
        note2:"The things that excites you most!"
      })
      initCardThree.save(function(err,newCard){
        if(err) return console.log(err);
      })


      
  });




  router.route('/logout')
      .get(function(req,res){
        req.logout();
        res.redirect('/');
      })

  // app zone, logged in
  router.use(function(req, res, next) {
    // console.log(req.method, req.url, req.body);
    if(req.isAuthenticated())
    return next();
    res.redirect('/');
    });

  router.route('/learn')
    .get(function(req,res){
      res.render('learn.ejs',{
        userId: req.user._id,
        userName:req.user.local.userName,
        userEmail:req.user.local.email
      });
      })

  router.route('/learning')
    .get(function(req,res){
      res.render('learning.ejs');
      })

  router.route('/tutor')
    .get(function(req,res){
      if(req.user.local.isTutor){
        res.render('tutor.ejs',{
          tutorId: req.user._id,
          tutorName:req.user.local.tutorName
        });}
      else{
        res.render('index.ejs');
      }})

  router.route('/tutoring')
    .get(function(req,res){
      if(req.user.local.isTutor){
        res.render('tutoring.ejs');
      }
      else{
        res.render('index.ejs');
      }
    })

  // router.route('/class')
  //   .get(function(req,res){
  //     if(req.user.local.isTutor){
  //       res.render("classTutor.ejs",{
  //         tutorId: req.user._id,
  //         tutorName:req.user.local.tutorName
  //       })
  //     }
  //     else if(req.user.local.isUser){
  //       res.render('classStudent.ejs',{
  //       userId: req.user._id,
  //       userName:req.user.local.userName,
  //       userEmail:req.user.local.email
  //     });
  //     }
  //   })

    app.get("/class",function(req,res){
      if(req.isAuthenticated()){
          if(req.user.local.isTutor){
            res.render("classTutor.ejs",{
              tutorId: req.user._id,
              tutorName:req.user.local.tutorName
            })
          }
          else if(req.user.local.isUser){
            res.render('classStudent.ejs',{
            userId: req.user._id,
            userName:req.user.local.userName,
            userEmail:req.user.local.email
          });
      }
      }else{
        res.render("classStudent",{
          userId:"558066e8ce5fff41ce460e6c"
        })
      }
    })





//==== socket.io
io.on('connection',function(socket){


  socket.on("oneSmallerCard",function(data){
    Card
    .find({userId:data[0],createdAt:{$lt:data[1]}})
    .sort({createdAt:-1})
    .limit(1)
    .exec(function(err,cards){
      if(err) return console.error(err);
      if(cards[0]){io.emit("oneSmallerCard"+data[0],cards);}
    })
  })
  socket.on("oneBiggerCard",function(data){
    Card
    .find({userId:data[0],createdAt:{$gt:data[1]}})
    .sort({createdAt:1})
    .limit(1)
    .exec(function(err,cards){
      if(err) return console.error(err);
      if(cards[0]){io.emit("oneBiggerCard"+data[0],cards);}
    })
  })

  socket.on("shareThis",function(data){
    Card.findById(data[0],function(err,card){
      if(err) return console.log(err);
      io.emit("shareThis",card);
    })
  })

  socket.on("tutorUpdate",function(updateInfo){
    Card
      .where({ _id: updateInfo._id })
      .update({
         $set: {
            note0:updateInfo.note0,
            note1:updateInfo.note1,
            note2:updateInfo.note2}
       },function(err,card){
          if(err) return console.log(err);
          console.log("from update")

    Card.findById(updateInfo._id,function(err,card){
      if(err) return console.log(err);
      io.emit("shareThis",card);
    })
        });


  })


  socket.on("contactMe",function(data){
    console.log(data);
    var mailOptions = {
      from: data.email, // sender address
      to: 'langtime@hotmail.com', // list of receivers
      subject: data.sub, // Subject line
      text: data.message, // plaintext body
      html: '<b>'+data.message+"  this is sent from "+data.email+" name: "+data.name+'</b>' // html body
    };

    transporter.sendMail(mailOptions, function(error, info){
        if(error){
            console.log(error);
        }else{
            console.log('Message sent: ' + info.response);
        }
    });

  })
  socket.on("currentMinutes",function(minReport){
    if(minReport[1]=="nonLearning"){
      Fire.child("minRecord").child(minReport[0]).once("value",function(snap){
        if(!(snap.hasChild("sum"))){
          Fire.child("minRecord").child(minReport[0]).update({sum:6});
          io.emit("currentMinutes"+minReport[0], 6);
        }else{
          var min = snap.val().sum;
          io.emit("currentMinutes"+minReport[0], min);
        }
      })
    }else if(minReport[1]=="learning"){
      Fire.child("minRecord").child(minReport[0]).once("value",function(snap){
        if(!(snap.hasChild("sum"))){
          Fire.child("minRecord").child(minReport[0]).update({sum:6});
          io.emit("currentMinutes"+minReport[0], 6);
        }else{
          var left=snap.val().sum-0.25;
          Fire.child("minRecord").child(minReport[0]).update({sum:left});
          io.emit("currentMinutes"+minReport[0], left);
        }
      })
    }
  })

  socket.on("updateUserName",function(data){
    User.findByIdAndUpdate(data[0], { $set: { "local.userName": data[1] } }, { upsert: true }, function(err,d){console.log(err)})
  })

  socket.on("updateTutorName",function(data){
    User.findByIdAndUpdate(data[0],{$set:{"local.tutorName":data[1]}},{upsert:true},function(err,d){console.log(err)})
  })
//== part I
  //== session control  =====
  // *********** broadcast requested, firebase ************
      
    socket.on("notReady",function(notReady){
      Fire.child(notReady[0]).once("value",function(snapshot){
        snapshot.forEach(function(snap){
          if(notReady[0]=="readyTutors"&&snap.val().tutorId==notReady[1]){
            Fire.child(notReady[0]).child(snap.key()).remove();
          }else if(notReady[0]=="studentList"&&snap.val()==notReady[1]){
            // console.log(notReady)
            // console.log(snap)
            Fire.child(notReady[0]).child(snap.key()).remove();
          }

        })
      })
    })

    socket.on("goBack",function(who){
      io.emit("goBack"+who[0],who)
      io.emit("goBack"+who[1],who)
    })

    //== tutorList is on request
    socket.on("tutorList",function(userId){
      Fire.child("readyTutors").once("value", function(snapshot) {
        snapshot.forEach(function(snap){
          var v=[snap.val().tutorId, snap.val().tutorName]
          // console.log(v[0]);
          setTimeout(function(){io.emit("tutorList"+userId,v)},0);
        });
      });
    });

//********************* self  ****************

    socket.on("sixSmallerCards",function(info){
      Card
      .find({userId:info[0],createdAt:{$lt:info[1]}})
      .sort({createdAt:-1})
      .limit(12)
      .exec(function(err,cards){
        if(err) return console.error(err);
        if(cards[0]){io.emit("sixSmallerCards"+info[2],cards);}
      })
    })

// ***************** only bi-directional******

  // for learn.ejs updating card by student
    socket.on("updateCard",function(updateInfo){
      console.log(updateInfo);
      Card.where({ _id: updateInfo._id }).update({
         $set: {
            keyWord0:updateInfo.keyWord0,
            keyWord1:updateInfo.keyWord1,
            keyWord2:updateInfo.keyWord2,
            note0:updateInfo.note0,
            note1:updateInfo.note1,
            note2:updateInfo.note2}
       },function(e,n){
          console.log(e);
          // console.log(n);
          // console.log("callback called")
      });
    })

    socket.on("start",function(command){
      console.log(command);
      if(command[0]=="fromStudent"){io.emit("start"+command[2],command)}
      else if (command[0]=="fromTutor"){io.emit("start"+command[1],command)}
    })



//== card controll =========
  //************************ self  ******
    socket.on("phraseBank", function(userId){
      // note for future: retrive only needed info 
      // coz cards are gonna be quite big
      Card.find({userId:userId},function(err,cards){
        if(err) return console.error(err);
        io.emit("phraseBank"+userId, cards);
        });
      });


    socket.on("newCard",function(cardInfo){
      Card.create(cardInfo,function(err,newCard){
        if(err) return console.log(err);
        io.emit("newCard"+newCard.userId,newCard)
      })
      })

    // URL: userId+createdAt
    socket.on('data',function(data){
      

      s3.upload({
        ACL: 'public-read',
        Bucket: BUCKET_NAME,
        Key: data[0].key,
        Body: data[0].body,
        ContentType: data[0].contentType
        }, function(err, callbackData) {
        if (err) {
          console.log("Error uploading data: ", err);
        } else {
          console.log("a new card created");
          console.log(data[0].contentType);

          var imageUrl="https://s3.amazonaws.com/langtime/"+data[0].key;
          console.log(imageUrl);
          var newCard = new Card({
            userId: data[1].userId,
            createdAt: data[1].createdAt,
            imageUrl:imageUrl,
            keyWord0:data[1].keyWord0,
            keyWord1:data[1].keyWord1,
            keyWord2:data[1].keyWord2,
            note0:data[1].note0,
            note1:data[1].note1,
            note2:data[1].note2
            })
          newCard.save(function(err,newCard){
            if(err) return console.log(err);
            io.emit("newCard"+newCard.userId,newCard)
          })

            }

        })
      })




    socket.on("deleteCard",function(theCard){
      Card.remove({_id:theCard[1]},function(){
        console.log("Deleted this card: "+theCard[1])
      })
      // if(theCard[0]!="somewhereElse"){
      //   s3.deleteObjects({
      //     Bucket: BUCKET_NAME, 
      //     Delete: {Objects: [{Key: theCard[0]}]}
      //     }, function(err, data) {
      //       if (err) console.log(err, err.stack); 
      //       else     {
      //         console.log(data);
      //         console.log("delete from amazon successful");
      //       }           
      //     }
      //   );
      // }
    })





//== part II
  //== session controll
  // *********** broadcast requested ******
  socket.on("inSession",function(command){
    if(command[0]=="student"){
      Fire.child("readyStudents").once("value",function(snapshot){
        snapshot.forEach(function(snap){
          if(snap.val()==command[1]){
            Fire.child("readyStudents").child(snap.key()).remove();
          }
        })
      })
    }else if(command[0]=="tutor"){
      Fire.child("readyTutors").once("value",function(snapshot){
        snapshot.forEach(function(snap){
          if(snap.val()==command[1]){
            Fire.child("readyTutors").child(snap.key()).remove();
          }
        })
      })
    }
  })





// synchCard begin

  socket.on("synchCard",function(command){
    Card.findById(command[2],function(err,card){
      if(err) return console.log(err);
      io.emit("synchCard"+command[0],card)
      io.emit("synchCard"+command[1],card)
    })
  })

  socket.on("synchUpdateCard",function(updateInfo){
    Card
      .where({ _id: updateInfo._id })
      .update({
         $set: {
            keyWord0:updateInfo.keyWord0,
            keyWord1:updateInfo.keyWord1,
            keyWord2:updateInfo.keyWord2,
            note0:updateInfo.note0,
            note1:updateInfo.note1,
            note2:updateInfo.note2}
       },function(err,card){
          if(err) return console.log(err);
          console.log("from update")

    Card.findById(updateInfo._id,function(err,card){
      if(err) return console.log(err);
      io.emit("synchCard"+updateInfo.userId,card)
      io.emit("synchCard"+updateInfo.tutorId,card)
    })
        });


  })

  socket.on("enableRealTimeNote",function(RTNote){
    //console.log(RTNote);
    io.emit("enableRealTimeNote"+RTNote[1],RTNote);
  })


  socket.on("messageInput",function(message){
    Fire.child("messageInput/"+message.belongTo).push(message);
    Fire.child("messageInput/"+message.belongTo).once("child_added",function(snapshot){
      var message = snapshot.val();
      io.emit("messageInput"+message.from,message)
      io.emit("messageInput"+message.to,message)
    })
  })

  socket.on("chatHistory",function(userId){
    Fire
    .child("messageInput/"+userId)
    .limitToLast(5)
    .once("value",function(snapshot){
      snapshot.forEach(function(snap){
        console.log(snap.val());
        io.emit("chatHistory"+userId,snap.val())
      })
    })
  })




  // io.on() end here
})










//============ experiment zone





//==end

app.get('/pricing',function(req,res){
  res.render('pricing.ejs')
});

app.get('/comeontutors',function(req,res){
  
  Fire.child("comeontutorsLog").push("one")
  res.render('comeontutors.ejs');
})




app.get('/zero6',function(req,res){
  res.render('zero6.ejs')
});

app.get('/zero',function(req,res){
  res.render('zero.ejs')
});

app.get('/zero0',function(req,res){
  res.render('zero0.ejs')
});

app.get('/zero1',function(req,res){
  res.render('zero1.ejs')
});

app.get('/zero2',function(req,res){
  res.render('zero2.ejs')
});

app.get('/zero3',function(req,res){
  res.render('zero3.ejs')
});

app.get('/zero4',function(req,res){
  res.render('zero4.ejs')
});

app.get('/zero5',function(req,res){
  res.render('zero5.ejs')
});

app.get('/play',function(req,res){
  res.render('play.ejs')
});

app.get('/zero7',function(req,res){
  res.render('zero7.ejs')
});

app.get('/zero8',function(req,res){
  res.render('zero8.ejs');

});



app.use('/',router);
http.listen(port,function(){
  console.log("happening here: 3000")
})



































