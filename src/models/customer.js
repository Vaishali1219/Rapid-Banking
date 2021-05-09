const mongoose = require('mongoose')
const validator = require('validator')
const Account = require('../models/account')

const customerSchema = new mongoose.Schema({
    //cust_id: {
    //    type: Number,
    //    unique: true
    //},
    first_name: {
        type: String,
        required: true,
        trim: true
    },
    last_name: {
        type: String,
        required: true,
        trim: true
    },
    email: {
        type: String,
        unique: true,
        required: true,
        trim: true,
        lowercase: true,
        validate(value) {
            if (!validator.isEmail(value)) {
                throw new Error('Email is invalid')
            }
        }
    },
    dob: {
        type: Date,
        required: true
    },
    age: {
        type: Number,
        required: true
    },
    sex: {
        type: Number,
        required: true,
        validate(value) {
            if (!value === 0) {
                throw new Error('Invalid')
            }
        }
    },
    phone: {
        type: String,
        unique: true,
        trim: true,
        validate(value) {
            var len = value.length
            var val = Number(value)
            if ((val === NaN) || (len > 10) || (len < 10)) {
                if (!validator.isNumeric(val)) {
                    throw new Error('Not a phone number')
                }
            }
        }
    },
    address: {
        type: String
    },
    city: {
        type: String
    },
    state: {
        type: String
    },
    country: {
        type: String
     },
    photo: {
        type: Buffer
    },
    accounts: [{
        _id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Account'
        },
        account_number: {
            type: Number
        },
        account_cat: {
            type: Number
        }
    }]
}, {
    timestamps: true
})

customerSchema.virtual('account', {
    ref: 'Account',
    localField: '_id',
    foreignField: 'customer'
})

customerSchema.methods.toJSON = function () {
    const customer = this
    const customerObject = customer.toObject()

    return customerObject
}

customerSchema.methods.checkAccounts = async (id, category_code, category_desc, balance) => {
    const customer = await Customer.findById(id)
    
    const email = customer.email
    const firstname = customer.first_name
    const lastname = customer.last_name
    const accounts = customer.accounts
    
    accounts.forEach(function (x) {
        console.log(x)
        if (x.account_cat == category_code) {
            res.status(400).json({
                error: `Customer already has an account in ${category_desc}`
            })
        } 
    })

    const account_number = Math.floor(1000000000000 + Math.random() * 9000000000000);
    console.log(account_number)

    const account = new Account({
        category: { cat_code: category_code, cat_desc: category_desc },
        customer: id,
        accountNumber: account_number,
        balance: balance
    })

    const cust_accounts = await account.save()

    console.log(cust_accounts)

    customer.accounts = customer.accounts.concat({
        account_number: cust_accounts.accountNumber,
        account_cat: category_code
    })

    await customer.save()

    custDetails = {
        id: id,
        email: email,
        firstname: firstname,
        lastname: lastname,
        account_number: custaccounts.accountNumber,
        category_desc: category_desc,
        balance: balance
    }

    return custDetails  
} 



const Customer = mongoose.model('Customer', customerSchema)

module.exports = Customer
