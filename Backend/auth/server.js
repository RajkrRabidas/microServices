require('dotenv').config();
const app = require('./src/app');
const connectDB = require('./src/db/db');


const PORT = process.env.PORT || 3000;

app.get("/", (req, res) =>{
    res.send("Welcome to the Swipt Card Service API");
})


connectDB()
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});