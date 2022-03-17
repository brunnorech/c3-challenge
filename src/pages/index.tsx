import { GetStaticProps } from 'next';
import Link from 'next/link';
import Header from '../components/Header';

import { getPrismicClient } from '../services/prismic';
import Prismic from '@prismicio/client';
import { format } from 'date-fns';

import commonStyles from '../styles/common.module.scss';
import styles from './home.module.scss';
import { useEffect, useState } from 'react';
import { FiCalendar } from 'react-icons/fi';
import { FiUser } from 'react-icons/fi';
import ptBR from 'date-fns/locale/pt-BR';

interface Post {
  uid?: string;
  first_publication_date: string | null;
  data: {
    title: string;
    subtitle: string;
    author: string;
  };
}

interface PostPagination {
  next_page: string;
  results: Post[];
}

interface HomeProps {
  postsPagination: PostPagination;
}

export default function Home({ postsPagination }: HomeProps) {
  // TODO
  console.log({ postsPagination }, '');
  const [posts, setPosts] = useState(postsPagination.results);
  const [nextPage, setNextPage] = useState(postsPagination.next_page);
  const [loading, setLoading] = useState(null);

  if (!postsPagination?.results.length) return null;

  const handleNextPage = () => {
    setLoading(true);

    fetch(nextPage)
      .then(res => res.json())
      .then(data => {
        setNextPage(data.next_page);
        setPosts(prev => [...prev, ...(data.results || [])]);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setNextPage(null);
      });
  };

  return (
    <>
      <Header />
      <section className={commonStyles.container}>
        {(posts || []).map(post => {

          return (
            <article key={post.uid} className={styles.postContent}>
              <Link href={`/post/${post.uid}`}>
                <h1>
                  {Array.isArray(post.data?.title)
                    ? post.data?.title?.find(title => title.text).text
                    : post.data?.title}
                </h1>
              </Link>
              <p>
                {Array.isArray(post.data?.subtitle)
                  ? post.data?.subtitle?.find(subtitle => subtitle.text).text
                  : post.data?.subtitle}
              </p>

              <div className={styles.infoContainer}>
                <div>
                  <FiCalendar />
                  <span>
                    {Array.isArray(post.data?.author)
                      ? post.data?.author?.find(author => author.text).text
                      : post.data?.author}
                  </span>
                </div>

                <div>
                  <FiUser />
                  <span>
                    {format(
                      new Date(post.first_publication_date),
                      'dd MMM yyyy',
                      {
                        locale: ptBR,
                      }
                    )}
                  </span>
                </div>
              </div>
            </article>
          );
        })}

        {nextPage !== null && (
          <div className={styles.containerButton}>
              <button
                onClick={() => handleNextPage()}
                disabled={loading || !nextPage}
                type="submit"
              >
                <span>Carregar mais posts</span>
              </button>
          </div>
        )}
      </section>
    </>
  );
}

export const getStaticProps: GetStaticProps = async () => {
  const prismic = getPrismicClient();

  const postsResponse = await prismic.query(
    [Prismic.predicates.at('document.type', 'posts')],
    {
      fetch: ['posts.title', 'posts.subtitle', 'posts.author'],
      pageSize: 2,
    }
  );

  return {
    props: {
      postsPagination: {
        results: postsResponse.results,
        next_page: postsResponse.next_page,
      },
    },
  };
};
