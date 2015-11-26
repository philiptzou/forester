"use strict";

module.exports = function (rule) {

  if (rule.method == 'find') {
    return forceWhere(rule);
  }

  if (rule.method == 'create') {
    return forceData(rule);
  }

  throw new Error("isOwner is not supported on rule " + rule.method);

};


export function forceWhere(rule) {

  return async function ({body, request, response}, next) {

    if (!body || !body.token) {
      response.status = 403;
      return;
    }

    var userId = body.token.userId;

    request.query = request.query || {};
    request.query.where = request.query.where || {};
    request.query.where[rule.property] = userId;

    await next();

  };
}

export function forceData(rule) {
  return async function ({body, request, response}, next) {

    if (!body || !body.token) {
      response.status = 403;
      return;
    }

    request.body = request.body || {};

    var userId = body.token.userId;

    request.body[rule.property] = userId;

    await next();

  };
}

export function forceId(rule) {
  return async function ({body, request, response, params}, next) {

    if (!body || !body.token) {
      response.status = 403;
      return;
    }

    var userId = body.token.userId;

    if (params.id !== userId) {
      response.status = 403;
      return;
    }

    await next();
  };
}