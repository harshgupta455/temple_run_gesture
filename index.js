const express = require("express")
const path = require("path")
const app = express()
const LogInCollection = require("./mongo")
const { exec } = require('child_process');
const port = process.env.PORT || 3000
const bcrypt = require('bcrypt');
const saltRounds = 10; // Number of salt rounds for bcrypt

const tempelatePath = path.join(__dirname, '../tempelates')
const publicPath = path.join(__dirname, '../public')
console.log(publicPath);

app.set('view engine', 'hbs')
app.set('views', tempelatePath)
app.use(express.static(publicPath))
app.use(express.json())
app.use(express.urlencoded({ extended: false }))



app.get('/signup', (req, res) => {
    res.render('signup')
})
app.get('/', (req, res) => {
    res.render('login')
})


app.post('/signup', async (req, res) => {
    const name = req.body.name;
    const password = req.body.password;

    try {
        // Check if the user already exists
        const existingUser = await LogInCollection.findOne({ name });

        if (existingUser) {
            // Check if the password matches
            const passwordMatch = await bcrypt.compare(password, existingUser.password);
            if (passwordMatch) {
                res.send("User details already exist");
                console.log("User details already exist");
                return;
            }
        }
        else{
        // Hash the password before storing it
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        // Save the user to the database
        await LogInCollection.create({ name, password: hashedPassword });
        console.log("User created successfully");
        }
    } catch (error) {
        console.error("Error:", error);
        res.status(500).send("Internal Server Error");
        return;
    }

    // Respond to the client
    exec('python3 temple_run.py', (error, stdout, stderr) => {
        if (error) {
            console.error(`Error executing Python script: ${error}`);
            return res.status(500).send('Error executing Python script');
        }
        console.log(`Python script output: ${stdout}`);
        res.send(stdout);
    });
    // res.status(201).render("home", { naming: name });
});



app.post('/login', async (req, res) => {
    try {
        const user = await LogInCollection.findOne({ name: req.body.name });

        if (!user) {
            return res.status(404).send("User not found");
        }

        // Compare hashed password
        const passwordMatch = await bcrypt.compare(req.body.password, user.password);

        if (passwordMatch) {
            // Execute Python script
            exec('python3 temple_run.py', (error, stdout, stderr) => {
                if (error) {
                    console.error(`Error executing Python script: ${error}`);
                    return res.status(500).send('Error executing Python script');
                }
                console.log(`Python script output: ${stdout}`);
                res.send(stdout);
            });
        } else {
            res.status(401).send("Incorrect password");
        }
    } catch (error) {
        console.error("Error:", error);
        res.status(500).send("Internal Server Error");
    }
});


app.listen(port, () => {
    console.log('port connected');
})