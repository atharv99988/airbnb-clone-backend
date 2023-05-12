const express = require('express')
const app = express()
const cors = require('cors')
const bcrypt = require('bcrypt')
const download = require('image-downloader');
const multer = require('multer')
const fs = require('fs')
const Booking = require('./models/booking.model')
const Place = require('./models/places.model')

require('dotenv').config()
const { default: mongoose } = require('mongoose')
const UserModel = require('./models/user')
const jwt = require('jsonwebtoken')
const cookieParser = require('cookie-parser')
const jwtsecret = 'asfadfadfjkasndfkskadjnfsajfn'
const PORT = process.env.PORT || 5000

app.use('/upload',express.static(__dirname + '/upload'))
app.use(express.json())
app.use(cors({
    credentials: true,
    origin: 'http://localhost:3000',
  }));
app.use(cookieParser())

mongoose.connect(process.env.MONGO_URL)

// register route
app.post('/register',async (req,res) => {
    try {
        const {name,email,password} = req.body
        const userdoc = await UserModel.create({name,email,password : bcrypt.hashSync(password,7)}) 
        res.json(userdoc)
    } catch (error) {
        res.status(422).json(error)
    }
})

// login route
app.post('/login',(req,res) => {
    const {email,password} = req.body
    UserModel.findOne({email}).then(user => {
        const correct = bcrypt.compareSync(password,user.password)
        if (correct){
            jwt.sign({email : user.email ,name : user.name, id : user._id},jwtsecret,{},(err,token)=>{
                if (err) {
                    res.json(err)
                    throw err;
                }
                res.cookie('token', token, { domain:'localhost', secure: true , sameSite:'none'})
                res.json(user)
            })
        }else{
            res.status(422).json({message : "password does not match"})
        }
    }).catch(err => {
        console.log(err);
        res.status(500).json({message : "User not found"})
    })
})

app.get('/user',(req,res) => {
    const {token} = req.cookies
    if(token){
        jwt.verify(token,jwtsecret,{},(err,user)=>{
            if (err) throw err
            res.json(user)
        })
    }else{
        res.json(null)
    }
})

app.post('/logout',(req,res) => {
    res.cookie('token','').json(true)
})

app.post('/upload',(req,res) => {
    const {link} = req.body 
    const newname = 'photo' + Date.now() + '.jpg'
    download.image({
        url : link,
        dest : __dirname + '/upload/' +newname
    }).then(({filename}) => {
        res.json(newname)
    }).catch(err => {
        res.json(err)
    })
})

const photomiddleware = multer({dest : 'upload'})

app.post('/upload-file', photomiddleware.array('photos',100) ,(req,res) => {
    const uploadfiles = []
    for(let i =0 ;i < req.files.length;i++){
        const{path,originalname} = req.files[i];
        const part = originalname.split('.')
        const ext = part[part.length - 1]
        let newPath = path + '.' + ext
        fs.renameSync(path,newPath)
        newPath = newPath.split(`\\`)[1]
        console.log(newPath);
        uploadfiles.push(newPath)
    }
    res.json(uploadfiles)
})


app.post('/place',(req,res) => {
    const {token} = req.cookies
    const {title , address , photos , description , perks , extrainfo , checkIn , checkOut , maxGuest,price} = req.body
    if(token){
        jwt.verify(token,jwtsecret,{},(err,user)=>{
            if (err) throw err
            Place.create({
                owner : user.id,
                title,
                address,
                photos,
                description,
                perks,
                extrainfo,
                checkIn ,
                checkOut,
                maxGuest ,
                price
            }).then(succ => {
                res.json(succ)
            }).catch(err => {
                throw err
            })
        })
    }
})

app.get('/user-place',async (req,res) => {
    const {token} = req.cookies
    let id = 0
    if(token){
        jwt.verify(token,jwtsecret,{},(err,user)=>{
            if (err) throw err
            id = user.id
        })
    }
    res.json(await Place.find({'owner' : id}))
})

app.get('/places',async (req,res) => {
    res.json(await Place.find())
})

app.get('/place/:id',async (req,res) => {
    const id = req.params.id
    const place = await Place.findById(id)
    res.json(place)
})


app.put('/place', async (req,res) => {
    const {token} = req.cookies;
    const {
        id,
        title,
        address,
        photos,
        description,
        perks,
        extrainfo,
        checkIn ,
        checkOut,
        maxGuest ,
        price
    } = req.body;



    jwt.verify(token, jwtsecret, {}, async (err, userData) => {
      if (err) throw err;
      const placeDoc = await Place.findById(id);
      console.log(placeDoc);
      if (userData.id === placeDoc.owner.toString()) {
        placeDoc.set({
          title,address,photos,description,
          perks,extrainfo,checkIn,checkOut,maxGuest,price
        });
        await placeDoc.save();
        res.json('ok');
      }
    });
  });

  app.post('/bookings', async (req, res) => {
    mongoose.connect(process.env.MONGO_URL);
    const userData = await getUserDataFromReq(req);
    const {
      place,checkIn,checkOut,numberOfGuests,name,phone,price,
    } = req.body;
    Booking.create({
      place,checkIn,checkOut,numberOfGuests,name,phone,price,
      user:userData.id,
    }).then((doc) => {
      res.json(doc);
    }).catch((err) => {
      throw err;
    });
  });
  

  function getUserDataFromReq(req) {
    return new Promise((resolve, reject) => {
      jwt.verify(req.cookies.token, jwtsecret, {}, async (err, userData) => {
        if (err) throw err;
        resolve(userData);
      });
    });
  }
  
  app.get('/bookings', async (req,res) => {
    mongoose.connect(process.env.MONGO_URL);
    const userData = await getUserDataFromReq(req);
    res.json( await Booking.find({user:userData.id}).populate('place') );
  });

  

app.listen(PORT,(req,res) => {
    console.log("server is up");
})