const mongoose = require('mongoose')


const urlSchema = new mongoose.Schema({
   urlCode: {
      type: String,
      unique: true,
      lowercase: true,
      trim: true
   },
   longUrl: {
      type: String,
      required: true,
      valid: true,
   },
   shortUrl: {
      type: String,
      required: true,
      unique: true
   }
});

module.exports = mongoose.model('Url', urlSchema)