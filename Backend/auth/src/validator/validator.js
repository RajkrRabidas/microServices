const z = require('zod');

// Define the schema for user registration data
const registerUserSchema = z.object({
    username: z.string().min(3, 'Username must be at least 3 characters long'),
    password: z.string().min(6, 'Password must be at least 6 characters long'),
    email: z.string().email('Invalid email address'),
    fullName: z.object({
        firstName: z.string().min(3, 'First name is required'),
        lastName: z.string().min(3, 'Last name is required'),
    }),
    phone: z.string().min(10, 'Phone number must be at least 10 digits long'),
});

const loginUserSchema = z.object({
    username: z.string().optional(),
    email: z.string().email('Invalid email address').optional(),    
    password: z.string().min(1, 'Password is required'),
}).refine(
    (data) => data.username || data.email,
    {
        message: 'Either username or email is required',
        path: ['username'],
    }
);

module.exports = {registerUserSchema, loginUserSchema};
