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
  // "b2xVn2": "http://www.lighthouselabs.ca",
  // "9sm5xK": "http://www.google.com",
  "b6UTxQ": { longURL: "https://www.tsn.ca", userID: "aJ48lW" },
  "i3BoGr": { longURL: "https://www.google.ca", userID: "aJ48lW" }
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

// Helper function to render the user information that matches the email input
function getUserByEmail(email) {
  for (const key in users) {
    if (email === users[key].email) {
      return users[key]
    }
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
  res.render("urls_index", templateVars);
});

app.get("/urls/new", function (req, res) {
  if (req.cookies["user_id"]) {
    const templateVars = { 
      user: req.cookies["user_id"]
    };
    res.render("urls_new", templateVars);
  } else {
    res.redirect("/login")
  }
});

app.post("/urls", (req, res) => {
  console.log(req.body);  // Log the POST request body to the console
  let shortURL = generateRandomString();
  urlDatabase[shortURL] = { longURL: req.body.longURL, userID: req.cookies["user_id"] }
  // console.log(urlDatabase);
  res.redirect(`/urls/${shortURL}`);
});

app.get("/urls/:shortURL", function (req, res) {
  const templateVars = {
    shortURL: req.params.shortURL,
    longURL: urlDatabase[req.params.shortURL].longURL,
    user: req.cookies["user_id"]
  };
  console.log(templateVars);
  res.render("urls_show", templateVars);
});

app.get("/u/:shortURL", (req, res) => {
  const longURL = urlDatabase[req.params.shortURL].longURL;
  res.redirect(longURL);
});

app.post("/urls/:shortURL/delete", (req, res) => {
  delete urlDatabase[req.params.shortURL]
  res.redirect("/urls");
});

app.post("/urls/:shortURL", (req, res) => {
  urlDatabase[req.params.shortURL].longURL = req.body.longURL;
  res.redirect("/urls");
})

////////// login existing user //////////
// Page that shows the login form
app.get("/login", function (req, res) {
  const templateVars = { 
    user: req.cookies["user_id"]
  };
  res.render("login", templateVars);
});

// Login button action
app.post("/login", function (req, res) {
  let email = req.body.email
  let password = req.body.password
  // Identify if user already exist or if fields are incorrect
  if (email === "" || password === "") {
    res.sendStatus(404)
  } else if (!getUserByEmail(email)) {
    res.sendStatus(403)
  } else if (getUserByEmail(email).password !== password) {
    res.sendStatus(403)
  } else {
    let id = getUserByEmail(email).id
    res.cookie("user_id", users[id].email)
    res.redirect("/urls");
  }
});

////////// logout //////////
app.post("/logout", (req, res) => {
  res.clearCookie("user_id");
  res.redirect("/urls");
})

////////// Register new user //////////
// Page that shows the registration form
app.get("/register", function (req, res) {
  const templateVars = { 
    user: req.cookies["user_id"]
  };
  res.render("registration", templateVars);
});

// Register button action > new cookie created, info stored in obj "users"
app.post("/register", function (req, res) {
  let id = generateRandomString();
  let email = req.body.email
  let password = req.body.password
    // 404 Error if empty email or password field, or if email matches users obj
  if (email === "" || password === "") {
    res.sendStatus(404)
  } else if (getUserByEmail(email)) {
    res.sendStatus(404)
  } else {
    users[id] = {
      id: id,
      email: email,
      password: password
    }
    res.cookie("user_id", users[id].email)
    res.redirect("/urls");
  }
});

////////// Connection established //////////
app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});