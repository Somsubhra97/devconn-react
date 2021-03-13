const express = require('express');
const router = express.Router();
const gravatar = require('gravatar');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { check, validationResult } = require('express-validator');

const User = require('../../models/User');

// @route    POST api/users
// @desc     Register user
// @access   Public
router.post(
  '/',
  [
    check('name', 'Name is required').not().isEmpty(),
    check('email', 'Please include a valid email').isEmail(),
    check(
      'password',
      'Please enter a password with 6 or more characters'
    ).isLength({ min: 6 })
  ],
 async (req,res,next)=>{

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }


    const { name, email, password } = req.body;

 try {
      let user = await User.findOne({ email });

      if (user) {
        return res
          .status(400)
          .json({ errors: [{ msg: 'User already exists' }] });
      }

      const avatar = normalize(
        gravatar.url(email, {
          s: '200',
          r: 'pg',
          d: 'mm'
        }),
        { forceHttps: true }
    );
     const createdUser = await User.create({
        name,
        email,
        role,
        avatar,
        password: hashedPassword,
      });

      sendTokenResponse(createdUser,200,res);
}
catch (err) {
      console.error(err.message);
      res.status(500).send('Server error');
    }

  }
);

//GET token and create cookie and send res
const sendTokenResponse=(user,statusCode,res)=>{

  let token;
  try {
    token = jwt.sign(
      {user},
      process.env.JWT_SECRET,
      { expiresIn: process.env.expiresIn }
    );
  } catch (err) {
    const error = new HttpError(
      'Logging in failed, please try again later.',
      500
    );
    return  res.status(500).send('Server error');
  }

  res.status(statusCode).json({success:true,token})
}

module.exports = router;
