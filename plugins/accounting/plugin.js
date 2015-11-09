"use strict";

import wrap from '../../lib/koa-ctx';
import crypto from 'crypto';

module.exports = function (forester) {

  var usersCollection = forester.registerCollection(require(__dirname + "/_users.json"));
  var tokensCollection = forester.registerCollection(require(__dirname + "/_tokens.json"));

  forester.registerEndpoint(
    {
      collectionName: "_users",
      method: "post",
      route: "/login",
      middlewares: [wrap(loginMiddleware({usersCollection, tokensCollection}))],
      description: "login and create a session token"
    }
  );

  forester.registerEndpoint(
    {
      collectionName: "_users",
      method: "post",
      route: "/logout",
      middlewares: [wrap(logoutMiddleware({tokensCollection}))],
      description: "login and create a session token"
    }
  );

};


export function loginMiddleware({usersCollection, tokensCollection}) {
  return async function ({request, response, params}, next) {

    var data = await request.json();
    response.body = response.body || {};

    var username = data.username;
    var password = data.password;

    var users = await usersCollection.findAll({where: {username: username}});

    if(users.length !== 1){
      response.body.done = false;
      response.body.errors = ['not_found'];
      await next;
      return;
    }

    var user = users[0];

    if(user.password !== password) {
      response.body.done = false;
      response.body.errors = ['bad_password'];
      await next;
      return;
    }

    var sessionData = {
      token: crypto.randomBytes(64).toString('hex'),
      datetime: new Date(),
      ip: request.ip,
      valid: true
    };

    var session = await tokensCollection.create(sessionData);

    response.body.data = session;
    response.body.done = true;

    await next;
  }
}

export function logoutMiddleware({tokensCollection}) {
  return async function ({request, response, params}, next) {

    var data = await request.json();
    response.body = response.body || {};

    var token = data.token;

    var sessions = await tokensCollection.findAll({where: {token}});

    if(sessions.length !== 1){
      response.body.done = false;
      response.body.errors = ['not_found'];
      await next;
      return;
    }

    var sessionData = sessions[0];
    sessionData.valid = false;

    var session = await tokensCollection.update(sessionData.id, sessionData);

    response.body.data = session;
    response.body.done = true;

    await next;
  }
}
