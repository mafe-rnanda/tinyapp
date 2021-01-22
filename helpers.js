// Renders the user information that matches the email input
const getUserByEmail = function(email, database) {
  for (const key in database) {
    if (email === database[key].email) {
      return database[key];
    }
  }
};

// Gives out a random id for users and shortURLS
const generateRandomString = function() {
  return Math.random().toString(20).substr(2, 6);
};

// Returns the URLs where the userID is equal to the id of the currently logged-in user
const urlsForUser = function(id, database) {
  let newDatabase = {};
  for (let u in database) {
    if (id === database[u].userID) {
      newDatabase[u] = database[u];
    }
  }
  return newDatabase;
};

const bcrypt = require("bcrypt");
//Bcrypt for passwords
const hashedP = function(password) {
  const salt = bcrypt.genSaltSync(10);
  const hashedPassword = bcrypt.hashSync(password, salt);
  return hashedPassword;
};

module.exports = {
  getUserByEmail,
  generateRandomString,
  urlsForUser,
  hashedP,
};
