require("dotenv").config();
const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { User } = require("../models");

const router = express.Router();

const authenticate = async (req, res, next) => {
    const authHeader = req.headers.authorization;
    console.log("Authorization Header:", authHeader)
  
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Unauthorized" });
    }
  
    const token = authHeader.split(" ")[1]; // Extract token part after "Bearer "
    console.log("authenticate token",token)
    try {
        const user = jwt.verify(token, process.env.JWT_SECRET);
        req.user = user;
        next();
    } catch (error) {
        res.status(403).json({ error: "Invalid token"});
    }
};

// User Registration
router.post("/register", async (req, res) => {
    try {
        const { username, email, password } = req.body;

        const existingUser = await User.findOne({ where: { email } });
        if (existingUser) {
            return res.status(400).json({ message: "Email is alread in user" });
        }

        // hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // create new user
        const user = await User.create({
            username,
            email,
            password_hash: hashedPassword,
            balance: 0.00
        });

        res.status(201).json({ message: "User registered successfully", user });
    } catch (error) {
        console.error("Registration Error", error);
        res.status(500).json({ message: "Server error" });
    }
});

// User login
router.post("/login", async (req, res) => {
    try {
        const { email, password } = req.body;
        // Find user by email
        const user = await User.findOne({ where: { email }});
        console.log("user:", user)

        if (!user) {
            return res.status(400).json({ message: "Invalid email or password" });
        }
        
        const isMatch = await bcrypt.compare(password, user.password_hash)
        if (!isMatch) {
            return res.status(400).json({ message: "Invalid email or password" });
        }

        const token = jwt.sign(
            { sub: user.user_id },
            process.env.JWT_SECRET,
            { expiresIn: "1h"}

        );
        
        res.json({ message: "Login successful", token, username: user.username });
        //res.json(token)
    } catch (error) {
        console.error("Login Error", error);
        res.status(500).json({ message: "Server error"});
    }
});

router.get("/account", authenticate, async (req, res) => {
    console.log(req)
    try {
      const user = await User.findByPk(req.user.sub, {
        attributes: ['user_id', 'email', 'username', 'created_at'],
      })
      if (!user) return res.status(404).json({ message: 'User not found' })
      res.json(user)
    } catch (err) {
        console.log(err)
      res.status(500).json({ message: 'Failed to fetch account info' })
    }
});

router.get("/balance", authenticate, async (req, res) => {
    try {
        const user = await User.findByPk(req.user.sub);
        res.json({ balance: user.balance });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error"});
    }
});


router.post("/deposit", authenticate, async (req, res) => {
    console.log(req.user)
    try {
        const { amount } = req.body;
        const user = await User.findByPk(req.user.sub);
        if (amount <= 0) return res.status(400).json({ error: "Invalid deposit amount" });
        await user.update({ balance: user.balance + amount });
        res.json({ message: `Deposited ${amount}`, balance: user.balance });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error"});
    }
});

router.post("/withdraw", authenticate, async (req, res) => {
    const { amount } = req.body;
    const user = await User.findByPk(req.user.sub);

    if (amount <= 0 || user.balance < amount) {
        return res.status(400).json({ error: "Invalid withdrawl amount" });
    }

    await user.update({ balance: user.balance - amount });
    message = 
    res.json({ message: `Withdrew ${amount}`, balance: user.balance });
});

router.post('/change-password', authenticate, async (req, res) => {
    const { currentPassword, newPassword } = req.body
    try {
      const user = await User.findByPk(req.user.sub)
      if (!user) {
        return res.status(404).json({ message: 'User not found.' })
      } 
  
      const passwordMatch = await bcrypt.compare(currentPassword, user.password_hash)
      if (!passwordMatch) {
        return res.status(401).json({ message: 'Current password is incorrect.' })
      }
      
      const hashedPassword = await bcrypt.hash(newPassword, 10)
      user.password_hash = hashedPassword
      await user.save()
  
      res.json({ message: 'Password changed successfully.' })
    } catch (error) {
      res.status(500).json({ message: 'Server error. Please try again later.' })
    }
});

module.exports = router;