'use client';

import { useEffect, useState, useRef } from "react";
import '../globals.css'
import { useRouter } from "next/navigation";
import { usePathname } from 'next/navigation';
import Link from 'next/link';

export function Posts() {
  const router = useRouter();
  const pathname = usePathname();
  const [posts, setPosts] = useState([]);
  const [postContent, setPostContent] = useState("");
  const postListRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [isMember, setIsMember] = useState(false);
  const [isModerator, setIsModerator] = useState(false);
  const [isOwner, setIsOwner] = useState(false);

  useEffect(() => {
    const getGroupAndCheckMembership = async () => {
      const parts = pathname.split("/");
      const gid = parts[2];

      try {
        const groupResponse = await fetch('/api/checkgroup', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ gid }),
        });

        if (!groupResponse.ok) {
          throw new Error('Get group failed');
        }

        const groupData = await groupResponse.json();
        if (!groupData.result) {
          router.push('/group-not-found');
          return;
        }

        const membershipResponse = await fetch('/api/checkmembership', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ gid }),
        });

        if (!membershipResponse.ok) {
          throw new Error('Get membership failed');
        }

        const membershipData = await membershipResponse.json();
        if (!membershipData.isMember) {
          router.push(`/groups/${gid}/join-group`);
          return;
        }

        if (membershipData.isOwner) {
          setIsOwner(true);
        }

        if (membershipData.isModerator) {
          setIsModerator(true);
        }

        await fetchPosts(gid);
        setIsMember(true);
      } catch (error) {
        console.error('Error checking group or membership:', error);
      } finally {
        setLoading(false);
      }
    };

    getGroupAndCheckMembership();
  }, [pathname, router]);

  useEffect(() => {
    if (postListRef.current) {
      postListRef.current.scrollTop = postListRef.current.scrollHeight;
    }
  }, [posts]);

  const fetchPosts = async () => {
    const parts = pathname.split("/");
    const gid = parts[2];
    try {
      const response = await fetch('/api/getposts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ gid }),
      });
  
      if (!response.ok) {
        throw new Error('Get posts failed');
      }
  
      const data = await response.json();
      const reversedPosts = data.posts.slice().reverse();
      setPosts(reversedPosts);
    } catch (error) {
      console.error('Get posts failed:', error);
    }
  };

  const handlePost = async (formData) => {
    const parts = pathname.split("/");
    const gid = parts[2];
    const post = formData.get('post');
    try {
      const response = await fetch('/api/post', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ post, gid }),
      });

      if (!response.ok) {
        throw new Error('Logout failed');
      }
      fetchPosts();
      setPostContent("");
    } catch (error) {
      console.error('Logout failed:', error);
    }
    router.refresh();
  };

  const deletePost = async (postid) => {
    try {
      const response = await fetch('/api/deletepost', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ postid }),
      });

      if (!response.ok) {
        throw new Error('Logout failed');
      }
      fetchPosts();
    } catch (error) {
      console.error('Logout failed:', error);
    }
    router.refresh();
  }

  const createMarkup = (content) => {
    const formattedContent = content.replace(/\n/g, '<br/>');
    return { __html: formattedContent };
  };

  if (loading) {
    return <div></div>;
  }

  return (
    <div className="post-container">
    {isMember && (
    <><div ref={postListRef} className='post-list'>
          {posts && posts.length > 0 ? (
            posts.slice().reverse().map(post => (
              <div className="post" key={post.id}>
                <Link href={`/users/${post.username}`} className="post-username">{post.username}</Link>
                <div className="post-content" dangerouslySetInnerHTML={createMarkup(post.content)} />
                <br />
                {(isOwner || (isModerator && !post.isModerator) || post.isMe) && (
                  <button onClick={() => deletePost(post.id)} className="delete-button">Delete</button>
                )}
              </div>
            ))
          ) : (
            <p></p>
          )}
        </div><form
          action={async (formData) => {
            await handlePost(formData);
          } }
        >
            <div className="post-box-container">
              <textarea className="post-box" type="post" name="post" placeholder="Post" autoComplete="off" rows={3} maxLength={10000} value={postContent} onChange={(e) => setPostContent(e.target.value)} />
              <br />
              <button className="post-button" type="submit">Post</button>
            </div>
          </form></>
      )}
    </div>
  );
}
