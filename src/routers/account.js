const express = require('express')
const Account = require('../models/account')
const Customer = require('../models/customer')
const Transaction = require('../models/transactionslog')

const { sendAccountOpenEmail, sendDebitAlertEmail, sendCreditAlertEmail } = require('../emails/mails')
const router = new express.Router()

//-------------------------TASK ROUTER FOR INSTRUCTORS----------------------------------------------

router.post('/create-account/:id', async (req, res) => {
    try {
        const customer = await Customer.findById(req.params.id)
        const category_code = req.body.category.code
        const category_desc = req.body.category.desc
        const balance = req.body.balance
        const checkStatus = await customer.checkAccounts(req.params.id, category_code, category_desc, balance)
	
        sendAccountOpenEmail(checkStatus.email, checkStatus.firstname, checkStatus.lastname, checkStatus.account_number, checkStatus.category_desc, checkStatus.balance)
        res.status(201).json({
            msg: "Account opened successfully",
            account_number: checkStatus.account_number,
            account_balance: checkStatus.balance,
            account_type: checkStatus.category_desc
      })
    } catch (e) {
		var error = "User already has an account in " + req.body.category.desc
        res.status(400).json({
            error: error
      })
    }
})

// 2) ONLY TASKS CREATED BY INSTRUCTORS-


// GET /tasks?completed=true
// GET /tasks?pageSize=${coursesPerPage}&currentPage=${currentPage}
// GET /tasks?sortBy=createdAt:desc or asc
router.get('/customer-accounts/:id', async (req, res) => {
  const customer = await Customer.findById(req.params.id)
  let customer_accounts = []
  const sort = {}

  if (req.query.sortBy) {
    const parts = req.query.sortBy.split(':')
    sort[parts[0]] = parts[1] === 'desc' ? -1 : 1
  }

  try {
    const accounts = await customer.populate({
      path: 'account',
      options: {
        limit: parseInt(req.query.limit),
        skip: parseInt(req.query.limit * (req.query.skip - 1)),
        sort
      }
    }).execPopulate()

      console.log(accounts.accounts)
      for (x in accounts.accounts) {
          var temp = await Account.find({ accountNumber: accounts.accounts[x].account_number })
          customer_accounts.push(temp)
      }

    let length = customer_accounts.length
    const full_Name = `${customer.first_name} ${customer.last_name}`
    
    res.status(200).json({
      customer: full_Name,
      accounts: customer_accounts,
      accountsCount: length
    })
  } catch (e) {
    res.status(500).json({
      error: e
    })
  }
})

router.get('/account', async (req, res) => {
    const accountNumber = parseInt(req.query.accountNumber)

    try {
        const account = await Account.findOne({ accountNumber: accountNumber })
		const customer = await Customer.findById(account.customer)
        if (!account) {
          return res.status(400).json({
            error: "Account Not Found"
          })
        }
      res.status(200).json({
        account: account,
		customer: customer
      })
    } catch (e) {
        res.status(400).json({
          error: "Account Not Found"
      })
    }
})

router.get('/transaction-logs', async (req, res) => {
	const trans = await Transaction.find({})
	
	res.status(200).json({
		transactions: trans
	})
})


router.delete('/delete-account', async (req, res) => {
    const accountNumber = parseInt(req.query.accountNumber)

    try {
        const account = await Account.findOne({ accountNumber: accountNumber })
        if (!account) {
            return res.status(404).json({
                error: "Not Found"
            })
        }

        const customer = await Customer.findOne({ _id: account.customer })

        for (x in customer.accounts) {
            if (accountNumber == customer.accounts[x].account_number) {
                customer.accounts.splice(x, 1)
                break
            }
        }

        await customer.save()
		
		await account.remove()

        res.status(200).json({
            "msg": "Account Closed and Removed"
        })
    } catch (e) {
        res.status(500).json({
            error: e
            //error: "Not Found"
        })
    }
})

// 3) UPDATE TASK



//----------------------TASKS ROUTERS FOR STUDENTS---------------------------------------------------

// 1) GET TASKS

router.get('/allaccounts', async (req, res) => {
    var mysort = {}

    if (req.query.sortBy) {
        const parts = req.query.sortBy.split(':')
        mysort[parts[0]] = parts[1] === 'desc' ? -1 : 1
    }

    var limit = parseInt(req.query.limit)
    var skip = parseInt(req.query.limit * (req.query.skip - 1))

    try {
      const accounts = await Account.find({}).sort(mysort).skip(skip).limit(limit)
      allAccounts = await Account.find({})
      let length = allAccounts.length

      res.status(200).json({
        accounts: accounts,
        accountCount: length
      })
    } catch (e) {
      return res.status(500).json({
        error: e
      })
    }
})

// 2) SUBSCRIBE TASKS

router.patch('/fund-transfer', async (req, res) => {
    const ac1 = await Account.findOne({ accountNumber: req.body.ac1 })
    const ac2 = await Account.findOne({ accountNumber: req.body.ac2 })
    const amount = req.body.amount

    try {
        if (ac1.accountNumber == ac2.accountNumber) {
            return res.status(400).json({
                "msg": "Funds Cannot be transfered between same accounts"
            })
        }
        const transferFunds = await ac1.makeTransaction(ac1.accountNumber, ac2.accountNumber, amount)

        console.log(transferFunds)
        if (transferFunds) {
            const c1 = await Customer.findById(transferFunds.c1)
            const c2 = await Customer.findById(transferFunds.c2)
            sendDebitAlertEmail(c1.email, c1.first_name, c1.last_name, ac1.accountNumber, transferFunds.a_cat_1.cat_desc, amount)
            sendCreditAlertEmail(c2.email, c2.first_name, c2.last_name, ac2.accountNumber, transferFunds.a_cat_2.cat_desc, amount)
            res.status(200).json({
                msg: "Funds Transfered Successfully"
            })
        }
    } catch (e) {
        res.status(400).json({
            "msg" :"Insufficient Funds"
        })
    }
})

router.patch('/credit-amount', async (req, res) => {
    const ac = await Account.findOne({ accountNumber: req.body.ac })
    const amount = req.body.amount

    try {
        const creditAmount = await ac.makeCreditTransaction(ac.accountNumber, amount)

        if (creditAmount) {
            const c = await Customer.findById(creditAmount.c)
            sendCreditAlertEmail(c.email, c.first_name, c.last_name, ac.accountNumber, creditAmount.a_cat.cat_desc, amount)
            res.status(200).json({
                msg: "Amount Credited Successfully"
            })
        }
    } catch (e) {
        res.status(400).json({
            error: "Account Not Found"
        })
    }
})

router.patch('/debit-amount', async (req, res) => {
    const ac = await Account.findOne({ accountNumber: req.body.ac })
    const amount = req.body.amount

    try {
        const debitAmount = await ac.makeDebitTransaction(ac.accountNumber, amount)

        if (debitAmount) {
            const c = await Customer.findById(debitAmount.c)
            sendDebitAlertEmail(c.email, c.first_name, c.last_name, ac.accountNumber, debitAmount.a_cat.cat_desc, amount)
            res.status(200).json({
                msg: "Amount Debited Successfully"
            })
        }
    } catch (e) {
        res.status(400).json({
            error: "Insufficient Funds"
        })
    }
})

module.exports = router
