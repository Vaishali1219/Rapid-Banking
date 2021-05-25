const mongoose = require('mongoose')
const Customer = require('../models/customer')
const TransactionLog = require('../models/transactionslog')

const accountSchema = new mongoose.Schema({
    category: {
        cat_code: {
            type: Number
        },
        cat_desc: {
            type: String
        }
    },
    customer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Customer'
    },
    accountNumber: {
        type: Number,
        unique: true
    },
    balance: {
        type: Number
    },
    transactions: [{
        transType: {
            type: Number        
		},
        time: {
            type: Date
        },
		amount:{
			type: Number
		},
        balanceAfter: {
            type: Number
        }
    }]
}, {
    timestamps: true
})

accountSchema.methods.toJSON = function () {
    const account = this
    const accountObject = account.toObject()

    return accountObject
}

accountSchema.methods.makeTransaction = async function (ac1, ac2, amount) {
    const session = await Account.startSession();
    session.startTransaction();

    try {
        const opts = { session }
        const time = new Date();
        const toAccount = await Account.findOne({ accountNumber: ac2 })
        const toAccount_After_Balance = parseInt(toAccount.balance) + parseInt(amount)
        const toAccount_transtype = 1
        const toAccount_transactions = {
            transType: toAccount_transtype,
            time: time,
			amount: amount,
            balanceAfter: parseInt(toAccount_After_Balance)
        }

        toAccount.balance = parseInt(toAccount_After_Balance)
        toAccount.transactions = toAccount.transactions.concat(toAccount_transactions)
        

        const fromAccount = await Account.findOne({ accountNumber: ac1 })
        if ((fromAccount.balance <= 0) | (fromAccount.balance < amount)) {
            await session.abortTransaction();
            return res.status(400).json({
                "error": "Insufficient Funds in the Account"
            })
        }

        const fromAccount_After_Balance = parseInt(fromAccount.balance) - parseInt(amount)
        const fromAccount_transtype = 0
        const fromAccount_transactions = {
            transType: fromAccount_transtype,
            time: time,
			amount: amount,
            balanceAfter: parseInt(fromAccount_After_Balance)
        }

        fromAccount.balance = parseInt(fromAccount_After_Balance)
        fromAccount.transactions = fromAccount.transactions.concat(fromAccount_transactions)
        await fromAccount.save()
        await toAccount.save()
		
		const trans = new TransactionLog({
			from_account_number: ac1,
			to_account_number: ac2,
			amount: amount
		})
		
		await trans.save()

        await session.commitTransaction()
        await session.endSession()
		
		var msg = amount + " transfered successfully";
        return {
            "msg": msg,
            c1: fromAccount.customer,
            c2: toAccount.customer,
            a_cat_1: fromAccount.category,
            a_cat_2: toAccount.category
        }
    } catch (e) {
        return res.status(500).send(e)
    }
}

accountSchema.methods.makeCreditTransaction = async function (ac, amount) {
    const session = await Account.startSession();
    session.startTransaction();

    try {
        const opts = { session }
        const time = new Date();
        const toAccount = await Account.findOne({ accountNumber: ac })
        const toAccount_After_Balance = parseInt(toAccount.balance) + parseInt(amount)
        const toAccount_transtype = 1
        const toAccount_transactions = {
            transType: toAccount_transtype,
            time: time,
			amount: amount,
            balanceAfter: parseInt(toAccount_After_Balance)
        }

        toAccount.balance = parseInt(toAccount_After_Balance)
        toAccount.transactions = toAccount.transactions.concat(toAccount_transactions)
        
        await toAccount.save()
		
		const trans = new TransactionLog({
			to_account_number: ac,
			amount: amount
		})
		
		await trans.save()

        await session.commitTransaction()
        await session.endSession()
		
		var msg = amount + " credited successfully";
        return {
            "msg": msg,
            c: toAccount.customer,
            a_cat: toAccount.category
        }
    } catch (e) {
        return res.status(500).send(e)
    }
}

accountSchema.methods.makeDebitTransaction = async function (ac, amount) {
    const session = await Account.startSession();
    session.startTransaction();

    try {
        const opts = { session }
        const time = new Date();
        
        const fromAccount = await Account.findOne({ accountNumber: ac })
        if ((fromAccount.balance <= 0) | (fromAccount.balance < amount)) {
            await session.abortTransaction();
            return res.status(400).json({
                "error": "Insufficient Funds in the Account"
            })
        }

        const fromAccount_After_Balance = parseInt(fromAccount.balance) - parseInt(amount)
        const fromAccount_transtype = 0
        const fromAccount_transactions = {
            transType: fromAccount_transtype,
            time: time,
			amount: amount,
            balanceAfter: parseInt(fromAccount_After_Balance)
        }

        fromAccount.balance = parseInt(fromAccount_After_Balance)
        fromAccount.transactions = fromAccount.transactions.concat(fromAccount_transactions)
        await fromAccount.save()
		
		const trans = new TransactionLog({
			from_account_number: ac,
			amount: amount
		})
		
		await trans.save()

        await session.commitTransaction()
        await session.endSession()
		
		var msg = amount + " transfered successfully";
        return {
            "msg": msg,
            c: fromAccount.customer,
            a_cat: fromAccount.category
        }
    } catch (e) {
        return res.status(500).send(e)
    }
}

const Account = mongoose.model('Account', accountSchema)

module.exports = Account
