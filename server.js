const cds = require("@sap/cds");
const express = require("express");
const path = require("path");

const COOKIE_NAME = "cap_user";
const COOKIE_MAX_AGE = 60 * 60 * 8;

cds.on("bootstrap", (app) => {
  const users = (cds.env && cds.env.requires && cds.env.requires.auth && cds.env.requires.auth.users) || {};

  function parseCookies(header) {
    const result = {};
    if (!header) return result;
    const parts = header.split(";");
    for (const part of parts) {
      const [key, ...rest] = part.trim().split("=");
      if (!key) continue;
      result[key] = decodeURIComponent(rest.join("="));
    }
    return result;
  }

  function setUserCookie(res, id) {
    const value = encodeURIComponent(id);
    res.setHeader(
      "Set-Cookie",
      `${COOKIE_NAME}=${value}; Path=/; Max-Age=${COOKIE_MAX_AGE}; HttpOnly; SameSite=Lax`,
    );
  }

  function clearUserCookie(res) {
    res.setHeader(
      "Set-Cookie",
      `${COOKIE_NAME}=; Path=/; Max-Age=0; HttpOnly; SameSite=Lax`,
    );
  }

  app.get("/login", (req, res) => {
    res.sendFile(path.join(cds.root, "app", "login.html"));
  });

  app.post("/auth/login", express.urlencoded({ extended: false }), (req, res) => {
    const id = (req.body && req.body.username) || "";
    const pwd = (req.body && req.body.password) || "";
    const user = users[id];

    if (!user || (user.password || "") !== pwd) {
      return res.redirect("/login?error=1");
    }

    setUserCookie(res, id);
    res.redirect("/launchpage.html");
  });

  app.post("/auth/logout", (req, res) => {
    clearUserCookie(res);
    res.redirect("/login");
  });

  app.get("/auth/me", (req, res) => {
    const cookies = parseCookies(req.headers.cookie || "");
    const id = cookies[COOKIE_NAME];
    const user = id && users[id];

    if (!user) return res.status(401).json({ error: "unauthorized" });
    return res.json({ id, roles: user.roles || [] });
  });
});

module.exports = cds.server;
