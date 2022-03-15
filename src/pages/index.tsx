import { GetStaticProps } from 'next';

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

  const [posts, setPosts] = useState([]);
  const [nextPage, setNextPage] = useState(null);

  useEffect(() => {
    setPosts(postsPagination.results);
    setNextPage(postsPagination.next_page);
  }, [postsPagination]);

  const handleNextPage = () => {
    fetch(nextPage)
      .then(res => res.json())
      .then(data => {
        const postsData = formatPosts(data);

        const merge = [...posts, ...postsData];

        setNextPage(data.next_page);
        setPosts(prev => [...prev, ...postsData]);
      });
  };

  return (
    <section className={commonStyles.postContainer}>
      {(posts || []).map(post => (
        <div key={post.uid} className={styles.postContent}>
          <h1>{post.data.title}</h1>
          <p>{post.data.subtitle}</p>

          <div className={styles.infoContainer}>
            <div>
              <FiCalendar />
              <span>{post.data.author}</span>
            </div>

            <div>
              <FiUser />
              <span>{post.first_publication_date}</span>
            </div>
          </div>
        </div>
      ))}

      {nextPage && (
        <div className={styles.containerButton}>
          <button onClick={() => handleNextPage()}>
            <span>Carregar mais posts</span>
          </button>
        </div>
      )}
    </section>
  );
}

const formatPosts = posts => {
  return posts.results.map(post => {
    return {
      uid: post.uid,
      first_publication_date: format(
        new Date(post.last_publication_date),
        "'Dia' dd 'de' MMMM 'de' yyyy'", {
          locale: ptBR
        }
      ),
      data: {
        title:
          post.data.title.find(title => title.type === 'paragraph').text ?? '',
        subtitle:
          post.data.subtitle.find(subtitle => subtitle.type === 'paragraph')
            .text ?? '',
        author:
          post.data.author.find(author => author.type === 'paragraph').text ??
          '',
      },
    };
  });
};

export const getStaticProps: GetStaticProps = async () => {
  const prismic = getPrismicClient();

  const postsResponse = await prismic.query(
    [Prismic.predicates.at('document.type', 'posts')],
    {
      fetch: ['posts.title', 'posts.subtitle', 'posts.author'],
      pageSize: 2,
    }
  );

  const posts = formatPosts(postsResponse);

  return {
    props: {
      postsPagination: {
        results: posts,
        next_page: postsResponse.next_page,
      },
    },
  };
};
