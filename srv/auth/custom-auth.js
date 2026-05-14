const cds = require("@sap/cds");
const mockedUsersFactory = require("@sap/cds/lib/srv/middlewares/auth/mocked-users");

const COOKIE_NAME = "cap_user";

module.exports = function customAuth(options) {
  const mockedUsers = mockedUsersFactory(options);

  return function customAuth(req, res, next) {
    const id = getCookie(req.headers.cookie, COOKIE_NAME);
    const user = id && mockedUsers.users[id];

    if (user) {
      const ctx = cds.context;
      if (ctx) {
        ctx.user = req.user = user;
        if (user.tenant) ctx.tenant = user.tenant;
        if (user.features) ctx.features = user.features;
      } else {
        req.user = user;
      }
    } else {
      const ctx = cds.context;
      if (ctx) ctx.user = req.user = cds.User.anonymous;
      else req.user = cds.User.anonymous;
    }

    next();
  };
};

function getCookie(header, name) {
  if (!header) return "";
  const parts = header.split(";");
  for (const part of parts) {
    const [key, ...rest] = part.trim().split("=");
    if (key === name) return decodeURIComponent(rest.join("="));
  }
  return "";
}
