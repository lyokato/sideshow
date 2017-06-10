import * as React from 'react';
import { connect } from 'react-redux';

import Header    from './Header';
import Footer    from './Footer';
import LoginForm from './LoginForm';
import Content   from './Content';

import { ActionRequestor, bindActionRequestor } from '../action'

export interface Props {
  loggedIn: boolean;
  request: ActionRequestor;
}

class App extends React.Component<Props, {}> {

  componentDidMount() {
    this.props.request("background/start", {});
  }

  render() {
    return (
      <div className="app-container">

        <Header />

        <section className="main">
          <div className="background" id="background"></div>
          {(() => {
            if (this.props.loggedIn) {
              return <Content />
            } else {
              return <LoginForm />
            }
          })()}
        </section>

        <Footer />


      </div>
    )
  }
}

function mapStateToProps(state: any):any {
  return {
    loggedIn: state.session.loggedIn,
  };
}

export default connect(mapStateToProps, bindActionRequestor)(App);
