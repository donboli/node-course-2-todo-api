// const MongoClient = require('mongodb').MongoClient;
const {MongoClient, ObjectID} = require('mongodb');

MongoClient.connect('mongodb://localhost:27017/TodoApp', (err, db) => {
  if (err) {
    return console.log('Unable to connect to MongoDB server');
  } else {

  }
  console.log('Connected to MongoDB server');

  db.collection('Users').findOneAndUpdate({
    name: "John Doe"
  }, {
    $set: { name: "Jane Doe" },
    $inc: { age: 1 }
  }, {
    returnOriginal: false
  }).then((res) => {
    console.log(JSON.stringify(res, undefined, 2));
  }, (err) => {
    console.log('Unable to update: ', err);
  });

  db.close();
});