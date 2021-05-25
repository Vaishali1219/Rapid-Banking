const mongoose = require('mongoose')

const transactionLogSchema = new mongoose.Schema({
    from_account_number: {
		type: Number
	},
	to_account_number: {
		type: Number
	},
	amount: {
		type: Number
	}
}, {
    timestamps: true
});

transactionLogSchema.index({createdAt: 1}, {expireAfterSeconds: 300});

const TransactionLog = mongoose.model('TransactionLog', transactionLogSchema)

module.exports = TransactionLog
