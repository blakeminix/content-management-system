import './/globals.css'
import { redirect } from "next/navigation";
import { getSession, login, logout } from './/lib.js';

export default async function Page() {
  const session = await getSession();
  if (session != null) {
    redirect('/dashboard');
  }
  // <pre>{JSON.stringify(session, null, 2)}</pre>
  return (
    <section>
      <form
        action={async (formData) => {
          "use server";
          await login(formData);
          redirect("/.");
        }}
      >
        <input type="text" name="username" placeholder="Username" />
        <br />
        <input type="text" name="password" placeholder="Password" />
        <br />
        <button type="submit">Login</button>
      </form>
    </section>
  );
}
