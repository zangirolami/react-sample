import { Err, Ok, Result } from '@hqoss/monads';
import axios from 'axios';
import { array, guard, object, string } from 'decoders';
import settings from '../config/settings';
import {
  Article,
  articleDecoder,
  ArticleForEditor,
  ArticlesFilters,
  FeedFilters,
  MultipleArticles,
  multipleArticlesDecoder,
} from '../types/article';
import { Comment, commentDecoder } from '../types/comment';
import { GenericErrors, genericErrorsDecoder } from '../types/error';
import { objectToQueryString } from '../types/object';
import { Profile, profileDecoder } from '../types/profile';
import { User, userDecoder, UserForRegistration, UserSettings } from '../types/user';

axios.defaults.baseURL = settings.baseApiUrl;

export async function getArticles(filters: ArticlesFilters = {}): Promise<MultipleArticles> {
  const finalFilters: ArticlesFilters = {
    limit: 10,
    offset: 0,
    ...filters,
  };

  const getRes = (await axios.get(`articles?${objectToQueryString(finalFilters)}`)).data;
  getRes.articlesCount = getRes.articles.length;
  for(const article of getRes.articles){
    article.createdAt = new Date(article.createdAt).toISOString(); 
    article.updatedAt = new Date(article.updatedAt).toISOString();
  }
  return guard(multipleArticlesDecoder)(getRes);
}

export async function getTags(): Promise<{ tags: string[] }> {
  return guard(object({ tags: array(string) }))((await axios.get('tags')).data);
}

export async function login(email: string, password: string): Promise<Result<User, GenericErrors>> {
  try {
    const { data } = await axios.post('users/login', { user: { email, password } });

    return Ok(guard(object({ user: userDecoder }))(data).user);
  } catch ({ data }) {
    return Err(guard(object({ errors: genericErrorsDecoder }))(data).errors);
  }
}

export async function getUser(): Promise<User> {
  const { data } = await axios.get('user');
  return guard(object({ user: userDecoder }))(data).user;
}

export async function favoriteArticle(slug: string): Promise<Article> {
  const { data } = await axios.post(`articles/${slug}/favorite`);
  data.article.createdAt = new Date(data.article.createdAt).toISOString(); 
  data.article.updatedAt = new Date(data.article.updatedAt).toISOString();
  return guard(object({ article: articleDecoder }))(data).article;
}

export async function unfavoriteArticle(slug: string): Promise<Article> {
  const { data } = await axios.delete(`articles/${slug}/favorite`);
  data.article.createdAt = new Date(data.article.createdAt).toISOString(); 
  data.article.updatedAt = new Date(data.article.updatedAt).toISOString();
  return guard(object({ article: articleDecoder }))(data).article;
}

export async function updateSettings(user: UserSettings): Promise<Result<User, GenericErrors>> {
  try {
    const { data } = await axios.put('user', {user: user});

    return Ok(guard(object({ user: userDecoder }))(data).user);
  } catch ({ response: { data } } ){
    return Err(guard(object({ errors: genericErrorsDecoder }))(data).errors);
  }
}

export async function signUp(user: UserForRegistration): Promise<Result<User, GenericErrors>> {
  try {
    const { data } = await axios.post('users', { user });
    return Ok(guard(object({ user: userDecoder }))(data).user);
  } catch ({ response: { data } }) {
    return Err(guard(object({ errors: genericErrorsDecoder }))(data).errors);
  }
}

export async function createArticle(article: ArticleForEditor): Promise<Result<Article, GenericErrors>> {
  try {

    const createArticleRes = await axios.post('articles', { article })
    const { data } = createArticleRes;
    data.article.createdAt = new Date(data.article.createdAt).toISOString(); 
    data.article.updatedAt = new Date(data.article.updatedAt).toISOString();
    return Ok(guard(object({ article: articleDecoder }))(data).article);
  } catch (error) {
    console.log(error);
    return Err(guard(object({ errors: genericErrorsDecoder }))(error).errors);
  }
}

export async function getArticle(slug: string): Promise<Article> {
  const { data } = await axios.get(`articles/${slug}`);
    data.article.createdAt = new Date(data.article.createdAt).toISOString(); 
    data.article.updatedAt = new Date(data.article.updatedAt).toISOString();
  return guard(object({ article: articleDecoder }))(data).article;
}

export async function updateArticle(slug: string, article: ArticleForEditor): Promise<Result<Article, GenericErrors>> {
  try {
    const { data } = await axios.put(`articles/${slug}`, { article });
    data.article.createdAt = new Date(data.article.createdAt).toISOString(); 
    data.article.updatedAt = new Date(data.article.updatedAt).toISOString();
    
    return Ok(guard(object({ article: articleDecoder }))(data).article);
  } catch ({ response: { data } }) {
    return Err(guard(object({ errors: genericErrorsDecoder }))(data).errors);
  }
}

export async function getProfile(username: string): Promise<Profile> {
  const { data } = await axios.get(`profiles/${username}`);
  return guard(object({ profile: profileDecoder }))(data).profile;
}

export async function followUser(username: string): Promise<Profile> {
  const { data } = await axios.post(`profiles/${username}/follow`);
  return guard(object({ profile: profileDecoder }))(data).profile;
}

export async function unfollowUser(username: string): Promise<Profile> {
  const { data } = await axios.delete(`profiles/${username}/follow`);
  return guard(object({ profile: profileDecoder }))(data).profile;
}

export async function getFeed(filters: FeedFilters = {}): Promise<MultipleArticles> {
  const finalFilters: ArticlesFilters = {
    limit: 10,
    offset: 0,
    ...filters,
  };
  const getRes = (await axios.get(`articles/feed?${objectToQueryString(finalFilters)}`)).data;
  getRes.articlesCount = getRes.articles.length;
  for(const article of getRes.articles){
    article.createdAt = new Date(article.createdAt).toISOString(); 
    article.updatedAt = new Date(article.updatedAt).toISOString();
  }
  return guard(multipleArticlesDecoder)(getRes);
}

export async function getArticleComments(slug: string): Promise<Comment[]> {
  const { data } = await axios.get(`articles/${slug}/comments`);
  for(const comment of data.comments){
    comment.createdAt = new Date(comment.createdAt).toISOString(); 
    comment.updatedAt = new Date(comment.updatedAt).toISOString();
  }
  return guard(object({ comments: array(commentDecoder) }))(data).comments;
}

export async function deleteComment(slug: string, commentId: string): Promise<void> {
  await axios.delete(`articles/${slug}/comments/${commentId}`);
}

export async function createComment(slug: string, body: string): Promise<Comment> {
  const { data } = await axios.post(`articles/${slug}/comments`, { comment: { body } });
  data.comment.createdAt = new Date(data.comment.createdAt).toISOString(); 
  data.comment.updatedAt = new Date(data.comment.updatedAt).toISOString();
  return guard(object({ comment: commentDecoder }))(data).comment;
}

export async function deleteArticle(slug: string): Promise<void> {
  await axios.delete(`articles/${slug}`);
}
