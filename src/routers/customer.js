//Import express for Router setup
//Models - User, Student 

const express = require('express')
const Customer = require('../models/customer')
const Account = require('../models/account')

const multer = require('multer')
const sharp = require('sharp')
const { sendWelcomeEmail, sendCancelEmail } = require('../emails/mails')
const router = new express.Router()

// Routes

//------------------------------REGISTRATION AND LOGIN ROUTES---------------------------------------------------

// 1)--------------------REGISTRATION

router.post('/register', async (req, res) => {
    const customer = new Customer(req.body)

    try {
        await customer.save()
        sendWelcomeEmail(customer.email, customer.first_name, customer.last_name)
        res.status(201).json({
            msg: 'Customer Created!',
            customer: customer
        })
    } catch (e) {
        var msg = 'error'

        if (e.keyValue.phone) {
            msg = "Phone No already enrolled"
        } else if (e.keyValue.email) {
            msg = "Email already enrolled"
        } else if ((e.keyValue.email) && (e.keyValue.phone)) {
            msg = "Email and Phone No already enrolled"
        } else {
            msg = e
        }

        res.status(400).json({
            msg: msg
        })
    }
})

//-------------------------------------USERS---------------------------------------------------------

//--------PROFILE DETAILS OF 

// 1) VIEW PROFILE ROUTES

router.get('/customers', async (req, res) => {
    var mysort = {}

    if (req.query.sortBy) {
        const parts = req.query.sortBy.split(':')
        mysort[parts[0]] = parts[1] === 'desc' ? -1 : 1
    }

    var limit = parseInt(req.query.limit)
    var skip = parseInt(req.query.limit * (req.query.skip - 1))

    try {
        const customers = await Customer.find({}).sort(mysort).skip(skip).limit(limit)
        allCustomers = await Customer.find({})
        let length = allCustomers.length

        res.status(200).json({
            customers: customers,
            customersCount: length
        })
    } catch (e) {
        return res.status(500).json({
            error: e
        })
    }
})

router.get('/get-customer', async (req, res) => {
    try {

        var val = null

        if (req.query.accountNumber) {
            const account = await Account.findOne({ accountNumber: req.query.accountNumber })
			if (account){
				const customer_id = account.customer
				const cust = await Customer.findById(customer_id)
				return res.status(200).json({
                id: customer_id,
				customer: cust
            })
			}
			
        } else {
            if (req.query.email) {
                val = req.query.email
            } else {
                val = req.query.phone
            }

            const customer = await Customer.findOne({ $or: [{ email: val }, { phone: val }] })
            return res.status(200).json({
                id: customer._id,
				customer: customer
            })
        }
    } catch (e) {
        res.status(400).json({
            error: e
        })
    }
})

router.get('/profile/:id', async (req, res) => {
    try {
        customer = await Customer.findById(req.params.id)
        if (customer) {
            res.status(200).json({
                customer: customer
            })
        }
    } catch (e) {
        res.status(400).json({
            error: e
        })
    }
})

// 2) UPDATE PROFILE ROUTES

router.patch('/customers/:id', async (req, res) => {
    const updates = Object.keys(req.body)
    const allowedUpdates = ['first_name', 'last_name', 'age', 'dob', 'sex', 'email', 'phone', 'address', 'city', 'state', 'country']
    const isValidOperation = updates.every((update) => allowedUpdates.includes(update))

    if (!isValidOperation) {
        return res.status(400).json({ error: 'Invalid updates!' })
    }

    try {
        customer = await Customer.findById(req.params.id)
        updates.forEach((update) => customer[update] = req.body[update])
        await customer.save()
      res.json({
        customer: customer
      })
    } catch (e) {
      res.status(400).json({
        error: e
      })
    }
})

// DELETE ACCOUNT ROUTES-

router.delete('/customers/:id', async (req, res) => {
    const customer = await Customer.findById(req.params.id)
    const email = customer.email
    const first_name = customer.first_name
    const last_name = customer.last_name
	const customer_accounts = customer.accounts
	
	for (ac in customer_accounts){
		var ac_id = ac._id
		var acc = await Account.findById(ac_id)
		await acc.remove()
	}

    try {
        await customer.remove()
        sendCancelEmail(email, first_name, last_name)
        res.send({
            msg: "Customer removed!!!"
        })
    } catch (e) {
        res.status(500).json({
            e: e
        })
    }
})

//------------------------------------------IMAGE UPLOADS-----------------------------------------------------------

const upload = multer({
    limits: {
        fileSize: 1000000000
    },
    fileFilter(req, file, cb) {
        if (!file.originalname.match(/\.(jpg|jpeg|png)$/)) {
            return cb(new Error('Please upload an image'))
        }

        cb(undefined, true)
    }
})

router.post('/customers/:id/photo', upload.single('photo'), async (req, res) => {
    const buffer = await sharp(req.file.buffer).png().toBuffer()
    const customer = await Customer.findById(req.params.id)
    customer.photo = buffer
    await customer.save()
  res.json({
    msg: "Photo updated successfully!!",
    customer: customer
  })
}, (error, req, res, next) => {
    res.status(400).json({ e: error.message })
})

router.delete('/customers/:id/photo', async (req, res) => {
    const customer = await Customer.findById(req.params.id)
    customer.photo = undefined
    await customer.save()
  res.json({
	"msg": "Customer Photo Deleted Successfully!!!",
    customer: customer
  })
})

router.get('/customers/:id/photo', async (req, res) => {
    const customer = await Customer.findById(req.params.id)
    
    try {
        
        if (!customer.photo) {
            throw new Error()
        }

        res.set('Content-Type', 'image/png')
        res.send(customer.photo)

    } catch (e) {
        res.status(404).json({
            e: e
        })
    }
})

module.exports = router
