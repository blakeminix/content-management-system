import Link from 'next/link'
import { logout, getSession, deleteAccount } from '../../lib'
import { redirect } from 'next/navigation';

export const metadata = {
  title: "Settings | CMS",
  description: "A content management system developed using React/Next.js for the front-end, Express.js/Node.js for the back-end, and MySQL for the back-end database.",
};
 
export default async function Page() {

  const session = await getSession();

  if (session == null) {
    redirect('/.');
  }
    
  return (
    <div>
      <div className="top-bar">
        <Link href="/dashboard">Dashboard</Link>
        <Link href="/[username]" as="/blakeminix">Profile</Link>
        <Link href="/settings">Settings</Link>
        <form
        action={async () => {
          "use server";
          await logout();
          redirect("/login");
        }}
        >
        <button type="submit">Logout</button>
        </form>

        <button className="prof"></button>

      </div>

      <form
        action={async () => {
          "use server";
          await deleteAccount();
          redirect("/login");
        }}
        >
          <div className='group-row'>
            <button type="submit">Delete Account</button>
          </div>
        </form>

    </div>
  );
}
