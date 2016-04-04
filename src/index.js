/* eslint-disable no-param-reassign */
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import React, { Component } from 'react';

const get = (obj, path) => (
  path.split('.').reduce((curObj, seg) => curObj[seg], obj)
);

const pick = (obj, keys) => (
  keys.reduce((nextObj, key) => {
    nextObj[key] = obj[key];
    return nextObj;
  }, {})
);

export default function createLocalReduxHelper({ localStatePath }) {
  let count = 0;
  const reducerMap = {};

  return {
    withLocalRedux(component, { id, actionTypes, getActionCreators, reducer }) {
      const ConnectedWrapper = connect(
        (state, { localStateId }) => (
          get(state, `${localStatePath}.${id}-${localStateId}`) || {}
        ),
        (dispatch, { localStateId }) => {
          const scopedActionTypes = {};
          actionTypes.forEach((type) => {
            scopedActionTypes[type] = `local-redux-state/${id}-${localStateId}/${type}`;
          });
          const actionCreators = getActionCreators(scopedActionTypes);

          return bindActionCreators(actionCreators, dispatch);
        }
      )(component);

      return class LocalReduxWrapper extends Component {
        constructor() {
          super();
          reducerMap[`${id}-${count}`] = reducer;
          this.state = { localStateId: count };
          count += 1;
        }
        render() {
          return React.createElement(
            ConnectedWrapper,
            Object.assign({}, this.props, this.state)
          );
        }
        componentWillUnmount() {
          delete reducerMap[`${id}-${self.state.localStateId}`];
        }
      };
    },
    reducer(state, { type, payload }) {
      if (type === 'local-redux-state-cleanup') {
        return pick(state, Object.keys(reducerMap));
      }

      const parseResult = /local-redux-state\/([^/]+)\/(.+)/.exec(type);
      if (!parseResult) {
        return state || {};
      }

      const [, componentId, localType] = parseResult;
      const reducer = reducerMap[componentId];

      if (!reducer) {
        return state || {};
      }

      return Object.assign({}, state, {
        [componentId]: reducer(state[componentId], {
          type: localType,
          payload,
        }),
      });
    },
    scheduleCleanup(dispatch) {
      return setInterval(() => {
        dispatch({ type: 'local-redux-state-cleanup' });
      }, 10000);
    },
  };
}
