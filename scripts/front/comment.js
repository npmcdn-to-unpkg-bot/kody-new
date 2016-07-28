import React from 'react';
// import Remarkable from 'remarkable';

export default class Comment extends React.Component {
    constructor() {
        super();

        // this.md = new Remarkable();
    }

    render() {
    
        return (
          <div className="comment">
            <h2 className="commentAuthor">
              {this.props.author}
            </h2>
            {this.props.children}
          </div>
        );
    }
};