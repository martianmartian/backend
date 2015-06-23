var bcrypt = require('bcrypt-nodejs')
var mongoose = require("mongoose");
var Schema = mongoose.Schema;
// mongoose.connect("mongodb://localhost:27017/langtime2")

mongoose.connect("mongodb://iamwave007:1111@novus.modulusmongo.net:27017/qez6Izah");
var db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));


//only one or two story on each card
// card be default don't need to store story id. 
// search story by card id instead. upper lever priority

// mongoose.connect("mongodb://iamwave007:0000@apollo.modulusmongo.net:27017/ubuve8Qy")

//http://stackoverflow.com/questions/7552804/changing-schemas-in-mongodb-mongoose
var cardSchema = new Schema({
  userId: {type: Schema.Types.ObjectId, ref: 'User', default:null},
  tutorId:{type: Schema.Types.ObjectId, ref: 'User', default:null},
  createdAt: { type: Number, default: Date.now() },
  imageUrl: String,
  keyWord0:{type: String, default:null},
  keyWord1:{type: String, default:null},
  keyWord2:{type: String, default:null},
  note0: {type: String, default:null},
  note1: {type: String, default:null},
  note2: {type: String, default:null},
  storyLog0:{type: Schema.Types.ObjectId, ref: 'Story', default:null},
  storyLog1:{type: Schema.Types.ObjectId, ref: 'Story', default:null},
  storyLog2:{type: Schema.Types.ObjectId, ref: 'Story', default:null}
  })

var storySchema = Schema({
  userId: {type: Schema.Types.ObjectId, ref: 'User', default:null},
  cardId:{type: Schema.Types.ObjectId, ref: 'Card', default:null},
  createdAt: { type: Date, default: Date.now },
  title    : {type: String, default:null},
  body     : {type: String, default:null}
});


var userSchema = new Schema({
  local           :{
    
    tutorName   :{type: String, default:null},
    isTutor     :{type: String, default:null},
    profilePic  :String,
    teachingExperience:String,
    eduction    :String,
    interest    :String,
    spokenLanguage:String,

    isUser      :{type: String, default:null},
    userName    :{type: String, default:"what's ya name "},
    
    email       :{type: String, default:null},
    password    :{type: String, default:null},
    address     :{type: Object, default:null},
    dob         :{type: Object, default:null},
    geolocation :{type: Object, default:null},
    tutoredBy   :[{type: Schema.Types.ObjectId, ref: 'Story', default:null}]
      }
})















userSchema.methods.generateHash = function(password){
return bcrypt.hashSync(password,bcrypt.genSaltSync(8),null);
};

userSchema.methods.validPassword = function(password){
return bcrypt.compareSync(password,this.local.password);
};


exports.Card = mongoose.model('Card',cardSchema)
exports.Story = mongoose.model('Story',storySchema)
exports.User = mongoose.model('User',userSchema)
