const sgMail = require('@sendgrid/mail')
const sendgridAPIKey = process.env.SENDGRID_API_KEY

sgMail.setApiKey(sendgridAPIKey)

const sendWelcomeEmail = (email, firstname, lastname) => {
    sgMail.send({
        to: email,
        from: 'vaishsvs12@gmail.com',
        subject: 'Thanks for joining in!',
        text: `Welcome ${firstname} ${lastname}, to RetailEasy Bank`
    })
}

const sendCancelEmail = (email, firstname, lastname) => {
    sgMail.send({
        to: email,
        from: 'vaishsvs12@gmail.com',
        subject: 'Cancellation',
        text: `Ooo ${firstname} ${lastname} Sorry may I knw the reason for your cancellation, anyhow your account with us is successfully cancelled`
    })
}

const sendAccountOpenEmail = (email, firstname, lastname, accountnumber, category, balance) => {
  sgMail.send({
    to: email,
    from: 'vaishsvs12@gmail.com',
    subject: `Your ${category} account is successfully opened!!`,
    text: `${firstname} ${lastname}, your ${category} account successfully opened your account number ${accountnumber} and balance is Rs.${balance}`
  })
}

const sendDebitAlertEmail = (email, firstname, lastname, accountnumber, category, amount) => {
  sgMail.send({
    to: email,
    from: 'vaishsvs12@gmail.com',
    subject: 'Your account has been debited',
    text: `${firstname} ${lastname}, your ${category} account ${accountnumber} has been debited for ${amount}. If this transaction is not done by you please report`
  })
}

const sendCreditAlertEmail = (email, firstname, lastname, accountnumber, category, amount) => {
    sgMail.send({
        to: email,
        from: 'vaishsvs12@gmail.com',
        subject: 'Your account has been credited',
        text: `${firstname} ${lastname}, your ${category} account ${accountnumber} has been credited for ${amount}. Please keep banking with us`
    })
}

module.exports = {
    sendWelcomeEmail,
    sendCancelEmail,
    sendAccountOpenEmail,
    sendDebitAlertEmail,
    sendCreditAlertEmail
}
