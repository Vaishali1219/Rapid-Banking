const express = require('express')
const path = require('path')
const debug = require("debug")("node-angular");
const http = require("http");
const bodyParser = require("body-parser");

// DB config files
require('./db/mongoose')

// Routers
const customerRouter = require('./routers/customer')
const accountRouter = require('./routers/account')

//mongodb+srv://VaishaliSharath:mDVk9h68Sqvm1tZK@cluster0.ocr2e.mongodb.net/eLearn


// Config
const app = express()
const port = process.env.PORT

app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept, Authorization"
  );
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET, POST, PATCH, PUT, DELETE, OPTIONS"
  );
  next();
});

//app.get('*', (req, res) => {
//  res.status(400).json({
//    error: 'invalid'
//  });
//});

// Middlewares
app.use(express.json())
app.use(customerRouter)
app.use(accountRouter)

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

app.get('', (req, res) => {
  res.json({
    msg: 'Welcome'
  })
});
const server = http.createServer(app);

// Setup server
server.listen(port, () => {
  console.log('Server is up on port ' + port)
});
