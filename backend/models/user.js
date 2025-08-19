const mongoose = require('mongoose');

const user_schema = new mongoose.Schema(
    {
        userName:{
            type : String,
            required: true,
        },
        userPhoneNum:{
            type : Number,
            required:true,
            unique : true,
            match: /^[0-9]{10}$/,
        },
        userEmail:{
            type : String,
            required : true,
            unique : true,
            lowercase: true,
            match : /.+\@.+\..+/,
        },
        userAadhar:{
            type : Number,
            required : true,
            unique : true,
            match : /^[0-9]{12}$/,
        },
        userAddress:{
            type : String,
            required : true,
        },
    }
);