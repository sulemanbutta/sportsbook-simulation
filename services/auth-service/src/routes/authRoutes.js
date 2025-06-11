require("dotenv").config();
const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

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

// Validation functions
const validateUsername = (username) => {
  const errors = [];
  if (!username) errors.push('Username is required');
  if (username && username.length < 3) errors.push('Username must be at least 3 characters');
  if (username && username.length > 20) errors.push('Username must be less than 20 characters');
  if (username && !/^[a-zA-Z0-9_]+$/.test(username)) {
    errors.push('Username can only contain letters, numbers, and underscores');
  }
  return errors;
};

const validateEmail = (email) => {
  const errors = [];
  if (!email) errors.push('Email is required');
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors.push('Email must be valid');
  }
  return errors;
};

const validatePassword = (password) => {
  const errors = [];
  if (!password) errors.push('Password is required');
  if (password && password.length < 8) {
    errors.push('Password must be at least 8 characters');
  }
  if (password && !/(?=.*[a-z])/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }
  if (password && !/(?=.*[A-Z])/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }
  if (password && !/(?=.*\d)/.test(password)) {
    errors.push('Password must contain at least one number');
  }
  if (password && !/(?=.*[@$!%*?&])/.test(password)) {
    errors.push('Password must contain at least one special character (@$!%*?&)');
  }
  return errors;
};

// User Registration
router.post("/register", async (req, res) => {
    try {
        const { username, email, password } = req.body;

        // Validate input
        const usernameErrors = validateUsername(username);
        const emailErrors = validateEmail(email);
        const passwordErrors = validatePassword(password);

        const allErrors = [...usernameErrors, ...emailErrors, ...passwordErrors];
        if (allErrors.length > 0) {
        return res.status(400).json({ 
            message: "Validation failed", 
            errors: allErrors 
        });
        }

        const { User } = req.db;

        // Check if email already exists
        const existingEmailUser = await User.findOne({ where: { email } });
        if (existingEmailUser) {
        return res.status(400).json({ 
            message: "Email is already in use",
            errors: ["Email is already registered"]
        });
        }

        // Check if username already exists
        const existingUsernameUser = await User.findOne({ where: { username } });
        if (existingUsernameUser) {
        return res.status(400).json({ 
            message: "Username is already taken",
            errors: ["Username is already taken"]
        });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create new user
        const user = await User.create({
            username,
            email,
            password_hash: hashedPassword,
            balance: 0.00
        });

        // Generate token for immediate login
        const token = jwt.sign(
        { sub: user.user_id },
        process.env.JWT_SECRET,
        { expiresIn: "15m" }
        );

        res.status(201).json({ 
        message: "User registered successfully",
        token,
        user: {
            user_id: user.user_id,
            username: user.username,
            email: user.email,
        }
        });
    } catch (error) {
        console.error("Registration Error", error);
        res.status(500).json({ 
            message: "Server error",
            errors: ["An unexpected error occurred"]
        });
    }
});

// User login
router.post("/login", async (req, res) => {
    try {
        const { email, password } = req.body;
        // Find user by email
        const { User } = req.db;
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
            { expiresIn: "15m"}

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
        const { User } = req.db;
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
        const { User } = req.db;
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
        const { User } = req.db;
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
    const { User } = req.db;
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
        const { User } = req.db;
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