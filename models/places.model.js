const mongoose = require('mongoose')

const PlaceSchema = new mongoose.Schema({
    title : String,
    address : String,
    photos : [String],
    description : String,
    perks : [String],
    extrainfo : String,
    checkIn : Number,
    checkOut : Number,
    maxGuest : Number,
    owner : String,
    price : Number,
})

// {type:mongoose.Schema.Types.ObjectId, ref:'Users'}

const PlaceModel = mongoose.model('Places',PlaceSchema)

module.exports = PlaceModel