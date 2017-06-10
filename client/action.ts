import {Dispatch} from 'redux'

export const createAction =
  function(actionType: string, params: any): any {
    return {
      type:   actionType,
      params: params,
    };
}

export type ActionRequestor = (actionType: string, params: any) => void;

export const bindActionRequestor =
  function(dispatch: Dispatch<any>): any {
    return {
      request: ((actionType: string, params: any) => {
        dispatch(createAction(actionType, params));
      })
    };
};
