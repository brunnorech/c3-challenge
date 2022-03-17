import { GetStaticPaths, GetStaticProps } from 'next';
import ptBR from 'date-fns/locale/pt-BR';
import { format } from 'date-fns';
import { FiCalendar } from 'react-icons/fi';
import { FiUser } from 'react-icons/fi';
import { FiClock } from 'react-icons/fi';
import Prismic from '@prismicio/client';
import PrismicDom from 'prismic-dom';

import { useRouter } from 'next/router';

import { getPrismicClient } from '../../services/prismic';
import Header from '../../components/Header';

import commonStyles from '../../styles/common.module.scss';
import styles from './post.module.scss';

interface Post {
  first_publication_date: string | null;
  data: {
    title: string;
    banner: {
      url: string;
    };
    author: string;
    content: {
      heading: string;
      body: {
        text: string;
      }[];
    }[];
  };
}

interface PostProps {
  post: Post;
}

export default function Post({ post }: PostProps) {
  const router = useRouter();

  if (router.isFallback) return <p>Carregando...</p>;

  const postResponse = formatPost(post);

  const arrayWords = (post.data.content || []).reduce((acc, item) => {
    const bodyText = PrismicDom.RichText.asText(item.body);

    const arrayBodyText = bodyText.split(' ');

    return [...acc, ...arrayBodyText];
  }, []);

  const estimatedTime = Math.ceil(arrayWords.length / 200);

  return (
    <>
      <Header post />

      <div className={styles.containerBanner}>
        <div className={styles.banner}>
          <img alt="banner" src={String(post.data.banner.url)} />
        </div>
      </div>

      <section className={commonStyles.container}>
        <div className={styles.postContainer}>
          <div className={`${styles.postContent} ${styles.postInfo}`}>
            {/* <h1>{(post.data.title.find(t => t.type === 'paragraph')text ?? ""}</h1> */}
            <h1>
              {Array.isArray(post.data.title)
                ? post.data.title.find(title => title.text).text
                : post.data.title}
            </h1>
            <div className={styles.containerInfos}>
              <FiCalendar />
              <span>
                {format(new Date(post.first_publication_date), 'dd MMM yyyy', {
                  locale: ptBR,
                })}
              </span>
              <FiUser />
              <span>
                {Array.isArray(post.data.author)
                  ? post.data.author.find(author => author.text).text
                  : post.data.author}
              </span>
              <FiClock />
              <span>{estimatedTime} min</span>
            </div>
          </div>
          {(post.data.content || []).map((content, index) => (
            <div className={styles.postContent} key={index}>
              <h2>
                {Array.isArray(content.heading)
                  ? content.heading.find(heading => heading.text).text
                  : content.heading}
              </h2>

              <>
                {content.body.map((b, index) => (
                  <div key={index}>
                    <p>{b.text}</p>
                  </div>
                ))}
              </>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}

const formatPost = response => {

  const author = response.data.author[0].text;
  const post = {
    first_publication_date: response.first_publication_date,
    data: {
      title: response.data?.title[0].text,
      banner: {
        url: response.data.banner.url,
      },
      author,
      content: (response.data?.content || []).map(content => {
        return {
          heading: content.heading[0].text,
          body: content.body.map(b => {
            return {
              text: b.text,
            };
          }),
        };
      }),
    },
  };

  return post;
};

export const getStaticPaths: GetStaticPaths = async () => {
  const prismic = getPrismicClient();
  const posts = await prismic.query(
    [Prismic.predicates.at('document.type', 'posts')],
    {
      fetch: [],
      pageSize: 2,
    }
  );

  const firstThreePosts = (posts.results || []).slice(0, 3);

  return {
    paths: firstThreePosts.map(post => ({
      params: { slug: post.uid },
    })),
    fallback: true,
  };
  // TODO
};

export const getStaticProps: GetStaticProps = async context => {
  const prismic = getPrismicClient();
  const slug = context.params?.slug || '';

  const response = await prismic.getByUID('posts', String(slug), {});

  return {
    props: {
      post: response,
    },
    revalidate: 60 * 60, //60 min
  };
};
