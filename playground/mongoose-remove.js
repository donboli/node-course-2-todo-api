const {ObjectID} = require('mongodb');

const {mongoose} = require('./../server/db/mongoose');
const {Todo} = require('./../server/models/todo');
const {User} = require('./../server/models/user');

// Todo.remove({}).then((res) => {
//   console.log(res);
// });

Todo.findOneAndRemove({_id: '5a47e723e58b8c326fb09ead'}).then((todo) => {
  console.log(todo);
});

Todo.findByIdAndRemove('5a47e723e58b8c326fb09ead').then((todo) => {
  console.log(todo);
});