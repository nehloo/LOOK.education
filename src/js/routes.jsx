/**
 * @package    look-education
 * @copyright  Copyright Nehloo Foundation, Inc.
 * @license    https://github.com/look-education/look-education/blob/master/LICENSE
 */

import HomePage from '../components/pages/HomePage';
import NotFoundPage from '../components/pages/NotFoundPage';
import PanelLeftPage from '../components/pages/PanelLeftPage';
import PanelRightPage from '../components/pages/PanelRightPage';
import CollectionPage from '../components/pages/CollectionPage';
import UserContentAnalyticsPage from '../components/pages/UserContentAnalyticsPage';
import VideoPlayPage from '../components/pages/VideoPlayPage';
import ARPage from '../components/pages/ARPage';
import QuizEditPage from '../components/pages/QuizEditPage';

export default [
  {
    name: 'home',
    path: '/',
    component: HomePage,
  },
  {
    name: 'latest',
    path: '/latest',
    component: HomePage,
    options: {
      props: {
        latest: true,
      }
    }
  },
  {
    name: 'favorites',
    path: '/favorites',
    component: HomePage,
    options: {
      props: {
        favorites: true,
      }
    }
  },
  {
    name: 'quizzes',
    path: '/quizzes',
    component: HomePage,
    options: {
      props: {
        quizzes: true
      }
    }
  },
  {
    name: 'activity',
    path: '/activity',
    component: UserContentAnalyticsPage
  },
  {
    path: '/panel-left/',
    component: PanelLeftPage,
  },
  {
    path: '/panel-right/',
    component: PanelRightPage,
  },
  {
    name: 'collection',
    path: '/collection/:collectionId?',
    component: CollectionPage,
  },
  {
    name: 'subscribers',
    path: '/subscribers/:collectionId?',
    component: CollectionPage,
    options: {
      props: {
        subscribers: true
      }
    }
  },
  {
    name: 'course',
    path: '/course/:collectionId?',
    component: CollectionPage,
  },
  {
    name: 'watch',
    path: '/watch/:contentId?',
    component: VideoPlayPage,
  },
  {
    name: 'ar',
    path: '/ar/',
    component: ARPage,
  },
  {
    name: 'topic',
    path: '/topic/:searchTerm?',
    component: HomePage,
  },
  {
    name: 'analytics',
    path: '/:userId/analytics/:collectionId?',
    component: UserContentAnalyticsPage,
  },
  {
    name: 'quizEdit',
    path: '/quiz/:contentId/edit',
    component: QuizEditPage,
  },
  {
    name: 'quiz',
    path: '/quiz/:contentId?',
    component: VideoPlayPage,
    options: {
      props: {
        takequiz: true
      }
    }
  },
  {
    name: 'user',
    path: '/:userId?', // keep this second to last, otherwise it will mess with panel-right page
    component: HomePage,
  },
  /*{
    name: 'collectionSlug',
    path: '/:userSlug/:collectionSlug?',
    component: CollectionPage,
  },*/ // TODO: implement slugs
  {
    name: '404',
    path: '(.*)', // this is for 404 errors (page not found)
    component: NotFoundPage,
  },
];
