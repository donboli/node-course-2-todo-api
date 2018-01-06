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

describe('GET /users/me', function () {
  it('should return user if authenticated', function (done) {
    const user = users[0];

    request(app)
      .get('/users/me')
      .set('x-auth', user.tokens[0].token)
      .expect(200)
      .expect((res) => {
        expect(res.body.email).toBe(user.email);
        expect(res.body._id).toBe(user._id.toHexString());
      })
      .end(done);
  });

  it('should return 401 if not authenticated', function (done) {
    request(app)
      .get('/users/me')
      .expect(401)
      .expect((res) => {
        expect(res.body).toEqual({});
      })
      .end(done);
  });
});

describe('POST /users', function () {
  it('should create a user', function (done) {
    var email = 'example@exmaple.com';
    var password = 'abc123!';

    request(app)
      .post('/users')
      .send({email, password})
      .expect(200)
      .expect((res) => {
        expect(res.header['x-auth']).toExist();
        expect(res.body._id).toExist();
        expect(res.body.email).toBe(email);
      })
      .end((err) => {
        if (err) {
          return done(err);
        }

        User.findOne({email: email}).then((user) => {
          expect(user).toExist();
          expect(user.password).toNotBe(password);
          done();
        });
      });
  });

  it('should return validation errors if request invalid', function (done) {
    var email = 'example';
    var password = 'abc';

    request(app)
      .post('/users')
      .send({email, password})
      .expect(400)
      .expect((res) => {
        expect(res.body.errors.email).toExist();
        expect(res.body.errors.password).toExist();
      })
      .end(done);
  });

  it('should not create user if email in use', function (done) {
    var email = users[0].email;
    var password = 'abc123!';

    request(app)
      .post('/users')
      .send({email, password})
      .expect(400)
      .expect((res) => {
        expect(res.body.errmsg).toExist();
      })
      .end(done);
  });
});

describe.only('POST /users/login', function () {
  it('should return the x-auth header with existing credentials', function (done) {
    request(app)
      .post('/users/login')
      .send({
        email: users[0].email,
        password: users[0].password
      })
      .expect(200)
      .expect((res) => {
        expect(res.header['x-auth']).toEqual(users[0].tokens[0].token);
        expect(res.body.email).toBe(users[0].email);
      })
      .end(done);
  });

  it('should return 400 with wrong credentials', function (done) {
    request(app)
      .post('/users/login')
      .send({
        email: 'asd',
        password: 'asd'
      })
      .expect(400)
      .expect((res) => {
        expect(res.header['x-auth']).toNotExist();
        expect(res.body).toEqual({});
      })
      .end(done);
  });
});