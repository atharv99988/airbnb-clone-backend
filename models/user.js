const mangoose = require('mongoose')

const UserSchema = new mangoose.Schema({
    name : String,
    email : {type : String , unique : true},
    password : String ,
})

const UserModel = mangoose.model('Users',UserSchema)

module.exports = UserModel


