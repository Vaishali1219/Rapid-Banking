const mongoose = require('mongoose')

//mDVk9h68Sqvm1tZK

//mongodb+srv://VaishaliSharath:mDVk9h68Sqvm1tZK@cluster0.ocr2e.mongodb.net/eLearn

mongoose.connect(process.env.MONGODB_URL, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useFindAndModify: false
})



