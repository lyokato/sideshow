import * as React from 'react'
import { connect } from 'react-redux';

export interface Props {
  connected: boolean;
  loggedIn:  boolean;
  nickname:  string;
}

class Header extends React.Component<Props, {}> {

  render() {
    return (
      <header>
        <div className="header-title">SIDESHOW</div>
        <div className="status-line">

          {(() => {
            if (this.props.connected) {
              return <span className="session-state session-state-online">ONLINE</span>
            } else {
              return <span className="session-state session-state-offline">OFFLINE</span>
            }
          })()}

          {(() => {
            if (this.props.loggedIn) {
              return <span className="session-nickname">{this.props.nickname}</span>
            }
          })()}

        </div>
      </header>
    )
  }
}

function mapStateToProps(state: any): any {
  return {
    connected: state.session.connected,
    loggedIn:  state.session.loggedIn,
    nickname:  state.session.nickname,
  }
}

export default connect(mapStateToProps)(Header)
