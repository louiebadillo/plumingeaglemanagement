import { combineReducers } from 'redux';
import { connectRouter } from 'connected-react-router';

import users from './users/usersReducers';

export default (history) =>
  combineReducers({
    router: connectRouter(history),
    users,
  });
