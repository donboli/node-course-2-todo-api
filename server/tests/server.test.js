const expect = require('expect');
const request = require('supertest');
const {ObjectID} = require('mongodb');

const { app } = require('./../server');
const { Todo } = require('./../models/todo');
const { User } = require('./../models/user');

const { todos, populateTodos, users, populateUsers } = require('./seed/seed');

beforeEach(populateUsers);
beforeEach(populateTodos);

describe('Todos', function () {
  describe('POST /todos', () => {
    it('should create a new todo', function (done) {
      var text = 'Test todo text';

      request(app)
        .post('/todos')
        .send({text})
        .expect(200)
        .expect((res) => {
          expect(res.body.text).toBe(text)
        })
        .end((err, res) => {
          if (err) {
            return done(err);
          }

          Todo.find({text}).then((todos) => {
            expect(todos.length).toBe(1);
            expect(todos[0].text).toBe(text);
            done();
          }).catch((e) => done(e));
        });
    });

    it('should not create todo with invalid data', function (done) {
      request(app)
        .post('/todos')
        .send()
        .expect(400)
        .end((err, res) => {
          if (err) {
            return done(err);
          }

          Todo.count().then((count) => {
            expect(count).toBe(2);
            done();
          }).catch((e) => done(e));
        });
    });
  });

  describe('GET /todos', function () {
    it('should get all todos', function (done) {
      request(app)
        .get('/todos')
        .expect(200)
        .expect((res) => {
          expect(res.body.todos.length).toBe(2);
        })
        .end(done);
    });
  });

  describe('GET /todos/:id', function () {
    it('should return todo doc', function (done) {
      request(app)
        .get(`/todos/${todos[0]._id.toString()}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.todo.text).toBe(todos[0].text);
        })
        .end(done);
    });

    it('should return a 404 if todo not found', function (done) {
      request(app)
        .get(`/todos/${new ObjectID().toString()}`)
        .expect(404)
        .expect((res) => {
          expect(res.body.todo).toBe(undefined);
        })
        .end(done);
    });

    it('should return a 404 for non-object ids', function (done) {
      request(app)
        .get(`/todos/123`)
        .expect(404)
        .expect((res) => {
          expect(res.body.todo).toBe(undefined);
        })
        .end(done);
    });
  });

  describe('DELETE /todos/:id', function () {
    it('should remove a todo', function (done) {
      var hexId = todos[1]._id.toString();

      request(app)
        .delete(`/todos/${hexId}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.todo._id).toBe(hexId);
        })
        .end((err, res) => {
          if (err) {
            return done(err);
          }

          Todo.findById(hexId).then((todo) => {
            expect(todo).toNotExist();
            done();
          }).catch((e) => done(e));
        });
    });

    it('should return 404 if todo not found', function (done) {
      var hexId = new ObjectID().toString();

      request(app)
        .delete(`/todos/${hexId}`)
        .expect(404)
        .expect((res) => {
          expect(res.body.todo).toBe(undefined);
        })
        .end(done);
    });

    it('should return 404 if object id is invalid', function (done) {
      request(app)
        .delete(`/todos/123`)
        .expect(404)
        .expect((res) => {
          expect(res.body.todo).toBe(undefined);
        })
        .end(done);
    });
  });

  describe('PATCH /todos/:id', function () {
    it('should update the todo', function (done) {
      const id = todos[0]._id;
      const updatedTodo = {
        text: 'Updated text',
        completed: true
      };

      request(app)
        .patch(`/todos/${id}`)
        .send(updatedTodo)
        .expect(200)
        .expect((res) => {
          expect(res.body.todo).toInclude(updatedTodo);
          expect(res.body.todo.completedAt).toBeA('number');
        })
        .end(done);
    });

    it('should clear completedAt when todo is not completed', function (done) {
      const id = todos[1]._id;
      const updatedTodo = {
        completed: false
      };

      request(app)
        .patch(`/todos/${id}`)
        .send(updatedTodo)
        .expect(200)
        .expect((res) => {
          expect(res.body.todo.completed).toBeFalsy();
          expect(res.body.todo.completedAt).toNotExist();
        })
        .end(done);
    });
  });
});