const express = require("express");
const app = express();
const mongoose = require("mongoose");
app.use(express.json());
const cors = require("cors");
app.use(cors({
    origin: "*"
}));
// app.use((req, res, next) => {
//     res.setHeader("Access-Control-Allow-Origin", "*");
//     res.setHeader(
//       "Access-Control-Allow-Methods",
//       "OPTIONS, GET, POST, PUT, PATCH, DELETE"
//     );
//     res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
//     if (req.method === "OPTIONS") {
//       return res.sendStatus(200);
//     }
//     next();
//   });


// cors orgin referece or jwt token origin: "*"

const bcrypt = require("bcryptjs");
app.set("view engine","ejs");
app.use(express.urlencoded({ extended: false }));

const jwt = require("jsonwebtoken");
var nodemailer = require('nodemailer');

const JWT_SECRET = "asdewjiskc879c^&*(94zc6['/okwdfdryeui9575/+_)(*846cz5$%^609(c84{\c6c1sc6s";

const mongUrl = "mongodb+srv://Jacob:jacob@cluster0.pdornlr.mongodb.net/"

mongoose.connect(mongUrl,{  
})
.then(() => {
    console.log("connected to Database");
})
.catch((e)=> console.log(e)); 

require("./userDetails")

const User = mongoose.model("UserInfo");

app.post("/register", async(req,res)=>{
    const { fname, lname, email, password} = req.body;

    const encrptedPassword = await bcrypt.hash(password,10);
    try {
        const oldUser = await User.findOne({email});
 
        if(oldUser){
            return res.send({ error: "User Already Exists"})
        }
        await User.create({
            fname ,
            lname ,
            email ,
            password: encrptedPassword,
        }); 
        res.send({status:"ok"});
    } catch (error) {
        res.send({status:"error"});
    }
});

app.post("/login-user", async (req,res)=>{
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if(!user){
        return res.json({ error: "User not found"})
     }
     if(await bcrypt.compare(password,user.password)){
        const token = jwt.sign({email: user.email}, JWT_SECRET)
    
        if(res.status(201)){
           return res.json({ status: "ok", data: token});
        } else{
           return res.json({ status: "error"});
        }
     }
    res.send({status: "error", error: "Invalid Password"})
});

app.post("/userData", async(req,res)=>{
    const {token} = req.body;
    try {
        const user = jwt.verify(token, JWT_SECRET);
        const userEmail = user.email;
        User.findOne({ email: userEmail })
        .then((data) => {
            res.send({ status : "ok", data: data});
        })
    } catch (error) {
        res.send({ status : "error", data: error});
    }
});


app.listen(5000,()=>{
    console.log("server started");
});

app.post("/forgot-password", async(req, res) => {
   const {email}   = req.body
   try {
    const oldUser = await User.findOne({email});
    if(!oldUser) {
        return res.json({status: "User Not Exists!!!" });
    } 
    const secret = JWT_SECRET + oldUser.password;
    const token = jwt.sign({ email: oldUser.email, id: oldUser._id}, secret, {expiresIn: "5m"});
    const link = `https://delicate-fox-eb8698.netlify.app/${oldUser._id}/${token}`;
    var transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: 'jack.joe1817@gmail.com',
          pass: 'mdda ooyj twpv nwjn'
        }
      });
      
      var mailOptions = {
        from: 'jack.joe1817@gmail.com',
        to: email,
        subject: 'Password Reset Link',
        text: 'Click this link to reset your password',
        text: link,
      };
      
      transporter.sendMail(mailOptions, function(error, info){
        if (error) {
          console.log(error);
        } else {
          console.log('Email sent: ' + info.response);
        }
      });
    console.log(link);
   } catch (error) {}
});

app.get("/reset-password/:id/:token", async (req, res) => {
    const { id, token } = req.params;
    console.log(req.params);
    const oldUser = await User.findOne({_id: id});
    if(!oldUser) {
        return res.json({status: "User Not Exists!!!" });
    } 
    const secret = JWT_SECRET + oldUser.password;
    try {
        const verify = jwt.verify(token, secret);
        res.render("index", {email: verify.email, status: "Not Verified"});
    } catch (error) {
        res.send('Not Verified');
    }
})

app.post("/reset-password/:id/:token", async (req, res) => {
    const { id, token } = req.params;
    const { password }  = req.body;
    console.log(password);
    const { confirmPassword } = req.body;
    console.log(confirmPassword);

    if(password == ""){
        console.log({status: "pls enter password!" });
    }
    else if (password !== confirmPassword){
        console.log({status: "Password didnot match!" });
    }
    else if (password === confirmPassword){
        console.log({status: "Password Updated!!!" });
    }

    const oldUser = await User.findOne({_id: id});
    if(!oldUser) {
        return res.json({status: "User Not Exists!!!" });
    } 
    const secret = JWT_SECRET + oldUser.password;
    try {
        const verify = jwt.verify(token, secret);
        const encrptedPassword = await bcrypt.hash(password,10);
        await User.updateOne({
            _id: id,
        },
        {
            $set: {
                password: encrptedPassword,
            },
        }
        );
        // res.json({ status: "Password Updated"});
        res.render("index", { email: verify.email, status: "verified" });
    } catch (error) {
        console.log(error);
        res.json({ status: "something went wrong"});
    }
});
