import jwt from "jsonwebtoken";

const ACCESS_TOKEN_SECRET = process.env.ACCESS_TOKEN_SECRET || "civicpulse_access_secret_123456";
const REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET || "civicpulse_refresh_secret_789012";

export function generateTokens(user) {
  const payload = { _id: user._id, email: user.email, role: user.role };
  const accessToken = jwt.sign(payload, ACCESS_TOKEN_SECRET, { expiresIn: "1d" });
  const refreshToken = jwt.sign({ _id: user._id }, REFRESH_TOKEN_SECRET, { expiresIn: "7d" });
  return { accessToken, refreshToken };
}

export function verifyAccessToken(token) {
  try {
    return jwt.verify(token, ACCESS_TOKEN_SECRET);
  } catch (err) {
    return null;
  }
}

export function verifyRefreshToken(token) {
  try {
    return jwt.verify(token, REFRESH_TOKEN_SECRET);
  } catch (err) {
    return null;
  }
}

export function parseCookies(cookieHeader) {
  if (!cookieHeader) return {};
  const cookies = {};
  cookieHeader.split(";").forEach(cookie => {
    const parts = cookie.split("=");
    if (parts.length >= 2) {
      const name = parts[0].trim();
      const val = parts.slice(1).join("=").trim();
      cookies[name] = decodeURIComponent(val);
    }
  });
  return cookies;
}

export function setTokenCookies(res, accessToken, refreshToken) {
  res.setHeader("Set-Cookie", [
    `accessToken=${accessToken}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${24 * 60 * 60}`,
    `refreshToken=${refreshToken}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${7 * 24 * 60 * 60}`
  ]);
}

export function clearTokenCookies(res) {
  res.setHeader("Set-Cookie", [
    `accessToken=; Path=/; HttpOnly; SameSite=Lax; Expires=Thu, 01 Jan 1970 00:00:00 GMT`,
    `refreshToken=; Path=/; HttpOnly; SameSite=Lax; Expires=Thu, 01 Jan 1970 00:00:00 GMT`
  ]);
}
