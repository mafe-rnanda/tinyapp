function generateRandomString() {
  return Math.random().toString(20).substr(2, 6);
}

const express = require("express");
const app = express();
const PORT = 8080; // default port 8080
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser")

app.set("view engine", "ejs");

app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());


const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com",
};

const users = {
  "userRandomID": {
    id: "userRandomID", 
    email: "user@example.com", 
    password: "purple-monkey-dinosaur"
  },
  "user2RandomID": {
    id: "user2RandomID", 
    email: "user2@example.com", 
    password: "dishwasher-funk"
  }
}

app.get("/", (req, res) => {
  res.send("Hello!");
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/hello", (req, res) => {
  res.send("<html><body>Hello <b>World</b></body></html>\n");
});

app.get("/urls", (req, res) => {
  const templateVars = { 
    urls: urlDatabase,
    user: req.cookies["user_id"]
  };
  console.log(typeof templateVars.user)
  res.render("urls_index", templateVars);
});

app.get("/urls/new", function (req, res) {
  const templateVars = { 
    user: req.cookies["user_id"]
  };
  res.render("urls_new", templateVars);
});

app.post("/urls", (req, res) => {
  console.log(req.body);  // Log the POST request body to the console
  let shortURL = generateRandomString();
  urlDatabase[shortURL] = req.body.longURL
  res.redirect(`/urls/${shortURL}`);
});

app.get("/urls/:shortURL", function (req, res) {
  const templateVars = {
    shortURL: req.params.shortURL,
    longURL: urlDatabase[req.params.shortURL],
    user: req.cookies["user_id"]
  };
  console.log(templateVars)
  res.render("urls_show", templateVars);
});

app.get("/u/:shortURL", (req, res) => {
  const longURL = urlDatabase[req.params.shortURL];
  res.redirect(longURL);
});

app.post("/urls/:shortURL/delete", (req, res) => {
  delete urlDatabase[req.params.shortURL]
  res.redirect("/urls");
});

app.post("/urls/:shortURL", (req, res) => {
  urlDatabase[req.params.shortURL] = req.body.longURL;
  //console.log(urlDatabase)
  res.redirect("/urls");
})

app.post("/login", (req, res) => {
  let username = req.body.username;
  res.cookie("user_id", username);
  res.redirect("/urls");
})

app.post("/logout", (req, res) => {
  let username = req.body.username;
  res.clearCookie("user_id", username);
  res.redirect("/urls");
})

// Register with email and password
// Page that shows the form to input information
app.get("/register", function (req, res) {
  const templateVars = { 
    user: req.cookies["user_id"]
  };
  res.render("registration", templateVars);
});

// Register button action > new cookie created, info stored in obj "users"
app.post("/register", function (req, res) {
  let userID = generateRandomString();
  users[userID] = {
    id: userID,
    email: req.body.email,
    password: req.body.password
  }
  console.log(users);
  res.cookie("user_id", users[userID].email)
  res.redirect("/urls");
});

// Connection established
app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});