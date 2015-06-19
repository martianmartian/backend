
// email verifications

var smtpTransport = nodemailer.createTransport("SMTP",{
  service:"Gmail",
  auth:{
    user:"ginx.qx@gmail.com",
    pass:"ili7mlilolk"
  }
})


app.get('/zero1',function(req,res){
  res.render('zero1.ejs')
});



var rand,mailOptions,host,link,a;

app.get('/send',function(req,res){
  a=new Date();
  rand="langtime"+a.getTime().toString(36).substring(2)+Math.random().toString(36).substring(2);
  host=req.get("host");
  link="http://"+req.get("host")+"/verify?id="+rand;
  mailOptions={
    to:req.query.to,
    subject:"Please confirm your Email account",
    html:"Hello,<br> Please Click on the link to verify your email.<br><a href="+link+">Click here to verify</a>" 
  }

  smtpTransport.sendMail(mailOptions,function(error,response){
    if(error){
      res.end("error");
    }else{
      res.end("sent");
    };
  })

});



app.get("/verify",function(req,res){
  //req.protocol   http
  //req.get("host")) ==host  localhost:3000
  //console.log(req.protocol+"://"+req.get("host"));
  if((req.protocol+"://"+req.get("host"))==(("http://"+host)))
  {
    console.log("Domain is matched. Information is from Authentic email");
    if(req.query.id==rand)
    {
        console.log("email is verified");
        res.end("Email "+mailOptions.to+" has been Successfully verified");
    }
    else
    {
        console.log("email is not verified");
        res.end("<h1>Bad Request</h1>");
    }
  }
  else{
    res.end("<h1>What you trying to do??");
  }

});
