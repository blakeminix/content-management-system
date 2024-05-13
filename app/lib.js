import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { redirect } from "next/navigation";
import { v4 } from "uuid";

// use environment variable for secretKey
const secretKey = process.env.SECRET_KEY;
const key = new TextEncoder().encode(secretKey);

const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host: 'localhost',
  port: '3307',
  user: process.env.USER,
  password: process.env.PASSWORD,
  database: process.env.DATABASE
});

export async function encrypt(payload) {

  const expiresIn = 30 * 24 * 60 * 60 * 1000;
  const expirationTime = Date.now() + expiresIn;

  return await new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(expirationTime)
    .sign(key);
}

export async function decrypt(input) {
  const { payload } = await jwtVerify(input, key, {
    algorithms: ["HS256"],
  });
  return payload;
}

export async function login(formData) {

  const name = formData.get("username");
  const password = formData.get("password");

  // Verify credentials && get the user
  const user = { username: name, sid: v4() };

  const [rows] = await pool.query('SELECT * FROM users WHERE username = ? AND password = ?', [name, password]);
  const valid = rows[0];

  if (valid) {
    // Create the session
    const expires = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    const session = await encrypt({ user, expires });

    // Save the session in a cookie
    cookies().set("session", session, { expires, httpOnly: true });
    redirect('/dashboard');
  } else {
    redirect('/.');
  }
}

export async function logout() {
  // Destroy the session
  cookies().set("session", "", { expires: new Date(0) });
}

export async function getSession() {
  const session = cookies().get("session")?.value;
  if (!session) return null;
  return await decrypt(session);
}

export async function signup(formData) {

  const name = formData.get("username");
  const password = formData.get("password");

  await pool.query('INSERT INTO users (username, password) VALUES (?, ?)', [name, password]);

  const user = { username: name, sid: v4() };

  // Create the session
  const expires = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
  const session = await encrypt({ user, expires });

  // Save the session in a cookie
  cookies().set("session", session, { expires, httpOnly: true });
  redirect('/dashboard');
}

export async function deleteAccount() {
  const session = cookies().get("session")?.value;
  if (!session) return;

  const parsed = await decrypt(session);
  const username = parsed.user.username;

  await pool.query('DELETE FROM users WHERE username = ?', [username]);

  cookies().set("session", "", { expires: new Date(0) });
}

export async function updateSession(request) {
  const session = request.cookies.get("session")?.value;
  if (!session) return;

  // Refresh the session so it doesn't expire
  const parsed = await decrypt(session);
  parsed.expires = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
  const res = NextResponse.next();
  res.cookies.set({
    name: "session",
    value: await encrypt(parsed),
    httpOnly: true,
    expires: parsed.expires,
  });
  return res;
}
