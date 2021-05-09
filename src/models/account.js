const mongoose = require('mongoose')
const Customer = require('../models/customer')

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
            type: Boolean
        },
        time: {
            type: Date
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

//accountSchema.methods.createAccount = async function (category_code, category_desc, id, balance) {
    

//    console.log(account)

//    return account
//}

accountSchema.methods.makeTransaction = async function (ac1, ac2, amount) {
    const session = await Account.startSession();
    session.startTransaction();

    try {
        const opts = { session }
        const time = new Date();
        console.log(ac1)
        const toAccount = await Account.findOne({ accountNumber: ac2 })
        console.log(toAccount)
        const toAccount_After_Balance = toAccount.balance + amount
        const toAccount_transtype = 1
        const toAccount_transactions = {
            transType: toAccount_transtype,
            time: time,
            balanceAfter: toAccount_After_Balance
        }
        console.log(toAccount_transactions)
        //await toAccount.updateOne({ accountNumber: ac2 }, { $addToSet: [{ balance: toAccount_After_Balance }, { transactions: toAccount_transactions }] }, opts)
        //await toAccount.save()

        toAccount.balance = toAccount_After_Balance
        toAccount.transactions = toAccount.transactions.concat(toAccount_transactions)
        

        const fromAccount = await Account.findOne({ accountNumber: ac1 })
        if ((fromAccount.balance <= 0) | (fromAccount.balance < amount)) {
            await session.abortTransaction();
            return res.status(500).json({
                "error": "Insufficient Funds in the Account"
            })
        }

        const fromAccount_After_Balance = fromAccount.balance - amount
        const fromAccount_transtype = 0
        const fromAccount_transactions = {
            transType: fromAccount_transtype,
            time: time,
            balanceAfter: fromAccount_After_Balance
        }

        console.log(fromAccount_transactions)
        //await fromAccount.updateOne({ accountNumber: ac1 }, { $addToSet: [{ balance: fromAccount_After_Balance }, { transactions: fromAccount_transactions }] }, opts)
        //await fromAccount.save()

        fromAccount.balance = fromAccount_After_Balance
        fromAccount.transactions = fromAccount.transactions.concat(toAccount_transactions)
        await fromAccount.save()
        await toAccount.save()

        await session.commitTransaction()
        await session.endSession()
        return {
            "msg": `${amount} transfered successfully`,
            c1: fromAccount.customer,
            c2: toAccount.customer,
            a_cat_1: fromAccount.category,
            a_cat_2: toAccount.category
        }
    } catch (e) {
        return res.status(500).send(e)
    }


    //const session = await Account.startSession();
    //const transactionOptions = {
    //    readPreference: 'primary',
    //    readConcern: { level: 'local' },
    //    writeConcern: {w: 'majority'}
    //};

    //try {
    //    const transactionResults = await session.withTransaction(async () => {
    //        const time = new Date();
    //        console.log(ac1)
    //        const toAccount = await Account.findOne({ accountNumber: ac2 })
    //        console.log(toAccount)
    //        const toAccount_After_Balance = toAccount.balance + amount
    //        const toAccount_transtype = 1
    //        const toAccount_transactions = {
    //            transType: toAccount_transtype,
    //            time: time,
    //            balanceAfter: toAccount_After_Balance
    //        }
    //        console.log(toAccount_transactions)
    //        const toAccount_updateResults = await Account.updateOne({ accountNumber: ac2 }, { $addToSet: [{ balance: toAccount_After_Balance }, { transactions: toAccount_transactions }] }, { session })

    //        const fromAccount = await Account.findOne({ accountNumber: ac1 })
    //        if ((fromAccount.balace <= 0) | (fromAccount.balace < amount)) {
    //            await (await session).abortTransaction();
    //            return res.status(500).json({
    //                "error": "Insufficient Funds in the Account"
    //            })
    //        }

    //        const fromAccount_After_Balance = fromAccount.balance - amount
    //        const fromAccount_transtype = 0
    //        const fromAccount_transactions = {
    //            transType: fromAccount_transtype,
    //            time: time,
    //            balanceAfter: fromAccount_After_Balance
    //        }

    //        const fromAccount_updateResults = await Account.updateOne({ accountNumber: ac1 }, { $addToSet: [{ balance: fromAccount_After_Balance }, { transactions: fromAccount_transactions }] }, { session })

    //    }, transactionOptions)



    //    if (transactionResults) {
    //        return res.status(200).json({
    //            "msg": `${amount} transfered successfully`,
    //            c1: fromAccount.customer,
    //            c2: toAccount.customer,
    //            a_cat_1: fromAccount.category,
    //            a_cat_2: toAccount.category
    //        })
    //    } else {
    //        return res.status(500).send(e)
    //    }
    //} catch (e) {
    //    return res.status(500).send(e)
    //} finally {
    //    await session.endSession()
    //}
}

const Account = mongoose.model('Account', accountSchema)

module.exports = Account
