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
    <section className='centered'>
      <div>
      <form
        action={async (formData) => {
          "use server";
          await login(formData);
        }}
      >
        <input type="username" name="username" placeholder="Username" />
        <br />
        <input type="password" name="password" placeholder="Password" />
        <br />
        <button type="submit">Login</button>
      </form>

      <form
        action={async () => {
          "use server";
          await logout();
          redirect("/signup");
        }}
        >
        <button type="submit">Sign Up</button>
        </form>
      </div>
    </section>
  );
}
