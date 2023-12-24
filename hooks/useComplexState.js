import React from "react";

const reducer = (prevState, nextState) => {
    return {...prevState, ...nextState};
};

export const useComplexState = initialState => {
    return React.useReducer(reducer, initialState);
};
