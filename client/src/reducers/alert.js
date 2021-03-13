import { SET_ALERT, REMOVE_ALERT } from '../actions/types';

const alertState = [];

export default function(state = alertState,{ type, payload }) {//action destructured
  
  switch (type) {
    case SET_ALERT:
      return [...state, payload];
    case REMOVE_ALERT:
      return state.filter(alert => alert.id !== payload);
    default:
      return state;
  }
}

//each reducer has its own initial State which returns modified state