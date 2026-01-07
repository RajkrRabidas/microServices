const z = require('zod');

// Define the schema for user registration data
const registerUserValidator = z.object({
    username: z.string().min(3).max(30)
             .message("Username must be between 3 and 30 characters"),
    password: z.string().min(6)
             .message("Password must be at least 6 characters long"),
    email: z.string().email()
             .message("Invalid email address"),
    fullName: z.object({
        firstName: z.string().min(1)
                     .message("First name is required"),
        lastName: z.string().min(1)
                        .message("Last name is required"),
    }),
    phone: z.string().regex(/^\+?[1-9]\d{1,14}$/)
             .message("Invalid phone number"),
});

module.exports = {
    registerUserValidator,
};