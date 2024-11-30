const Account = require("../models/accountModel");
const transporter =require("../config/emailservice");
const User = require("../models/userModel");

//@desc   >>>> Create Account
//@route  >>>> POST /api/account/create
//@Access >>>> Private (through admin approve only)
const createAccount = async (req, res, next) => {
  try {
    const account = await Account.create({
      client_id: req.body.id,
      balance: req.body.balance,
    });
    //go to notification
    req.approved = {
      request_id: req.body.request_id,
      client_id: account.client_id,
      account_id: account.id,
    };
    next();
  } catch (error) {
    if (error.message.match(/(Balance|Account|id)/gi)) {
      return res.status(400).send(error.message);
    }
    res.status(500).send("Ooops!! Something Went Wrong, Try again...");
  }
};

//@desc   >>>> Get account
//@route  >>>> GET /api/account/:id
//@Access >>>> private(User)
const getAccount = async (req, res) => {
  let account;
  try {
    account = await Account.findById(req.params.id);
    res.status(200).json(account);
  } catch (error) {
    if (!account) return res.status(404).send("Account Not Found!");
    res.status(500).send("Ooops!! Something Went Wrong, Try again...");
  }
};

//@desc   >>>> Delete Account
//@route  >>>> DELETE /api/account/:id
//@Access >>>> private(for user only)
const deleteAccount = async (req, res) => {
  try {
    const deletedAccount = await Account.findByIdAndDelete(req.params.id);
    res.status(200).json({ id: deletedAccount.id });
  } catch (error) {
    res.status(500).send("Ooops!! Something Went Wrong, Try again...");
  }
};

//@desc   >>>> Transfer Money
//@route  >>>> PUT /api/account/transfer/:from_id/:to_id
//@Access >>>> private(for User only)
const sendMail = async (parentemail) => {
  // console.log("parent email", parentemail)
  const mailOptions = {
    from: 'sanjay809697@gmail.com', // Sender address
    to: parentemail, // Receiver address
    subject: 'Transaction Alert', // Subject line
    text: `Dear Parent,

    Your child is trying to make a payment of more than 5000RS.
    
    Please review and either accept or decline this transaction by clicking the appropriate button below.
    
    If you did not authorize this transaction, please contact our support team immediately.
    
    Thank you for using ePay.
    
    Best regards,
    ePay Support Team`,
        html: `
          <p>Dear Parent,</p>
          <p>Your child is trying to make a payment of more than 5000RS.</p>
          <p>Please review this transaction and select an option below:</p>
          <div style="margin-top: 20px;">
            <a href="https://yourdomain.com/approve-transaction?transactionId=12345" 
               style="text-decoration: none; color: white; background-color: green; padding: 10px 20px; border-radius: 5px; font-weight: bold;">Accept</a>
            <a href="https://yourdomain.com/decline-transaction?transactionId=12345" 
               style="text-decoration: none; color: white; background-color: red; padding: 10px 20px; border-radius: 5px; font-weight: bold; margin-left: 10px;">Decline</a>
          </div>
          <p>If you did not authorize this transaction, please contact our support team immediately.</p>
          <p>Thank you for using ePay.</p>
          <p>Best regards,<br/>ePay Support Team</p>
        `, // HTML body
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent: ' + info.response);
  } catch (error) {
    console.error('Error sending email:', error);
  }
};
const transfer = async (req, res, next) => {
  const { balanceTransfered } = req.body;
 
  if(balanceTransfered >= 5000)
  {
    console.log(balanceTransfered);
    const sendingAccount = await User.findById(req.body.id);
    const sendingAccount2 = await Account.findById(req.params.from_id);
    // console.log("sending account", sendingAccount)
     await sendMail(sendingAccount.parentemail);
     res.status(200).send(sendingAccount2);
     next();
     return 1; 
  }
  try {
    //get sending user account
  
    const sendingAccount = await Account.findById(req.params.from_id);

    //get receiving user account
    const receivingAccount = await Account.findById(req.params.to_id);

    //update both users' accounts with new tranfer values
    // 1- balance
    // console.log(sendingAccount)
    sendingAccount.balance -= +balanceTransfered;
    sendingAccount.markModified("balance");
    receivingAccount.balance += +balanceTransfered;
    receivingAccount.markModified("balance");
    // 2- transfer log >> out (sending user)
    sendingAccount.out.push({
      to: receivingAccount.id,
      balance_transfered: balanceTransfered,
    });
    sendingAccount.markModified("out");
    // 2- transfer log >> in (receiving user)
    receivingAccount.in.push({
      from: sendingAccount.id,
      balance_transfered: balanceTransfered,
    });
    receivingAccount.markModified("in");
    //Save Transfer operation for both users' accounts
    const updatedSendingAccount = await sendingAccount.save();
    const updatedReceivingAccount = await receivingAccount.save();
    //go to notification
    req.transfered = {
      updatedSendingAccount,
      updatedReceivingAccount,
      balanceTransfered,
    };
    console.log("yes");
    res.status(200);
    next();
    
   
  } catch (error) {
    console.log("error");
    if (error.message.match(/(transfer|id|Balance|Account)/gi))
      return res.status(400).send(error.message);
    res.status(500).send("Ooops!! Something Went Wrong, Try again...");
  }
};

//@desc   >>>> Deposit Money
//@route  >>>> PUT /api/account/deposit/:id
//@Access >>>> private(for User only)
const deposit = async (req, res) => {
  //check for empty body request
  if (!req.body.depositAmount) {
    return res.status(400).send("empty body request");
  }
  const { depositAmount } = req.body;
  try {
    //get account
    const account = await Account.findById(req.params.id);

    //update  user's balance with new deposit value
    account.balance += +depositAmount;
    account.markModified("balance");

    //update user's withdraw logs with new deposit log
    account.deposit_logs.push({
      depositted_amount: +depositAmount,
    });
    account.markModified("deposit_logs");

    //Save Deposit operation
    const updatedAccount = await account.save();

    res.status(200).json(updatedAccount);
  } catch (error) {
    console.log(error);
    if (error.message.match(/(Balance|Account)/gi))
      return res.status(400).send(error.message);
    res.status(500).send("Ooops!! Something Went Wrong, Try again...");
  }
};

//@desc   >>>> Withdraw Money
//@route  >>>> PUT /api/account/withdraw/:id
//@Access >>>> private(for User only)
const withdraw = async (req, res) => {
  //check for empty body request
  if (!req.body.withdrawAmount) {
    return res.status(400).send("empty body request");
  }
  const { withdrawAmount } = req.body;
  try {
    //get account
    const account = await Account.findById(req.params.id);

    //update user's balance with new withdrawl value
    account.balance -= +withdrawAmount;
    account.markModified("balance");

    //update user's withdraw logs with new withdrawl log
    account.withdraw_logs.push({
      withdrawed_amount: +withdrawAmount,
    });
    account.markModified("withdraw_logs");

    //Save Deposit operation
    const updatedAccount = await account.save();

    res.status(200).json(updatedAccount);
  } catch (error) {
    if (error.message.match(/(Balance|Account)/gi))
      return res.status(400).send(error.message);
    res.status(500).send("Ooops!! Something Went Wrong, Try again...");
  }
};

module.exports = {
  createAccount,
  deleteAccount,
  getAccount,
  transfer,
  deposit,
  withdraw,
};
